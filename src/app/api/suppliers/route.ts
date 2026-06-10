import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const suppliers = await prisma.supplier.findMany({
    where: { shopId: user.shopId },
    orderBy: { name: "asc" },
    include: { _count: { select: { purchaseOrders: true } } },
  });

  return Response.json(suppliers);
}

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.name?.trim()) return Response.json({ error: "Name required" }, { status: 400 });

  const supplier = await prisma.supplier.create({
    data: {
      name: body.name.trim(),
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      address: body.address?.trim() || null,
      notes: body.notes?.trim() || null,
      shopId: user.shopId,
    },
    include: { _count: { select: { purchaseOrders: true } } },
  });

  return Response.json(supplier, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json().catch(() => ({}));
  if (!id) return Response.json({ error: "ID required" }, { status: 400 });

  const supplier = await prisma.supplier.findFirst({ where: { id, shopId: user.shopId } });
  if (!supplier) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.supplier.delete({ where: { id } });
  return Response.json({ ok: true });
}
