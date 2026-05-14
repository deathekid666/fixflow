import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.workOrder.findFirst({
    where: { id: params.id, shopId: user.shopId ?? undefined },
  });

  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  const { sparePartId, quantity } = await req.json();

  if (!sparePartId || !quantity || quantity < 1) {
    return Response.json({ error: "sparePartId and quantity required" }, { status: 400 });
  }

  const part = await prisma.sparePart.findFirst({
    where: { id: sparePartId, shopId: user.shopId ?? undefined },
  });

  if (!part) return Response.json({ error: "Part not found" }, { status: 404 });

  if (part.stock < quantity) {
    return Response.json({ error: "Insufficient stock" }, { status: 400 });
  }

  const total = part.unitPrice * quantity;

  const [workOrderPart] = await prisma.$transaction([
    prisma.workOrderPart.create({
      data: {
        workOrderId: params.id,
        sparePartId,
        quantity,
        unitPrice: part.unitPrice,
        total,
      },
      include: {
        sparePart: { select: { id: true, name: true, partNumber: true } },
      },
    }),
    prisma.sparePart.update({
      where: { id: sparePartId },
      data: { stock: { decrement: quantity } },
    }),
  ]);

  // Recalculate order totals
  const allParts = await prisma.workOrderPart.findMany({
    where: { workOrderId: params.id },
  });
  const subtotal = allParts.reduce((sum, p) => sum + p.total, 0);

  await prisma.workOrder.update({
    where: { id: params.id },
    data: { subtotal, total: subtotal - order.discount },
  });

  await prisma.operationLog.create({
    data: {
      action: "PART_ADDED",
      description: `Added ${quantity}x ${part.name}`,
      workOrderId: params.id,
      userId: user.id,
    },
  });

  return Response.json(workOrderPart, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { partId } = await req.json();

  const workOrderPart = await prisma.workOrderPart.findFirst({
    where: { id: partId, workOrderId: params.id },
  });

  if (!workOrderPart) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.workOrderPart.delete({ where: { id: partId } }),
    prisma.sparePart.update({
      where: { id: workOrderPart.sparePartId },
      data: { stock: { increment: workOrderPart.quantity } },
    }),
  ]);

  return Response.json({ success: true });
}
