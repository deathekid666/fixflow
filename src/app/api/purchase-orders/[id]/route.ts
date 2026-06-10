import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.purchaseOrder.findFirst({
    where: { id: params.id, shopId: user.shopId },
    include: {
      supplier: true,
      items: { include: { sparePart: true } },
      creator: { select: { name: true } },
    },
  });

  if (!order) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(order);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Body required" }, { status: 400 });

  const order = await prisma.purchaseOrder.findFirst({
    where: { id: params.id, shopId: user.shopId },
  });
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  if (Array.isArray(body.items)) {
    const items = body.items as { sparePartId: string; quantity: number; unitCost: number }[];
    const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

    await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: params.id } });

    const updated = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        notes: body.notes !== undefined ? body.notes || null : order.notes,
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
    return Response.json(updated);
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id: params.id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });

  return Response.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.purchaseOrder.findFirst({
    where: { id: params.id, shopId: user.shopId },
  });
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.purchaseOrder.delete({ where: { id: params.id } });
  return Response.json({ ok: true });
}
