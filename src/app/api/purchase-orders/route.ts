import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get("supplierId");

  const orders = await prisma.purchaseOrder.findMany({
    where: { shopId: user.shopId, ...(supplierId ? { supplierId } : {}) },
    include: {
      supplier: true,
      items: {
        include: { sparePart: { select: { name: true, partNumber: true } } },
      },
      creator: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(orders);
}

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.supplierId || !Array.isArray(body?.items) || body.items.length === 0) {
    return Response.json({ error: "supplierId and items required" }, { status: 400 });
  }

  const supplier = await prisma.supplier.findFirst({
    where: { id: body.supplierId, shopId: user.shopId },
  });
  if (!supplier) return Response.json({ error: "Supplier not found" }, { status: 404 });

  const items = body.items as { sparePartId: string; quantity: number; unitCost: number }[];
  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  const order = await prisma.purchaseOrder.create({
    data: {
      supplierId: body.supplierId,
      shopId: user.shopId,
      userId: user.id,
      notes: body.notes?.trim() || null,
      status: "DRAFT",
      totalAmount,
      items: {
        create: items.map(i => ({
          sparePartId: i.sparePartId,
          quantity: i.quantity,
          unitCost: i.unitCost,
          totalCost: i.quantity * i.unitCost,
        })),
      },
    },
    include: {
      supplier: true,
      items: { include: { sparePart: { select: { name: true, partNumber: true } } } },
      creator: { select: { name: true } },
    },
  });

  return Response.json(order, { status: 201 });
}
