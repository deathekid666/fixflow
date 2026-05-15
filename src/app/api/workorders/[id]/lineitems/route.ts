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

  const { label, amount } = await req.json();

  if (!label || amount === undefined) {
    return Response.json({ error: "label and amount are required" }, { status: 400 });
  }

  const item = await prisma.quotationLineItem.create({
    data: { label, amount: Number(amount), workOrderId: params.id },
  });

  // Recalculate totals
  const allItems = await prisma.quotationLineItem.findMany({ where: { workOrderId: params.id } });
  const quotationItems = allItems.reduce((sum, i) => sum + i.amount, 0);
  const total = order.subtotal + quotationItems - order.discount;

  await prisma.workOrder.update({
    where: { id: params.id },
    data: { quotationItems, total },
  });

  return Response.json(item, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await req.json();

  const item = await prisma.quotationLineItem.findFirst({
    where: { id: itemId, workOrderId: params.id },
  });
  if (!item) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.quotationLineItem.delete({ where: { id: itemId } });

  // Recalculate totals
  const order = await prisma.workOrder.findUnique({ where: { id: params.id } });
  const allItems = await prisma.quotationLineItem.findMany({ where: { workOrderId: params.id } });
  const quotationItems = allItems.reduce((sum, i) => sum + i.amount, 0);
  const total = (order?.subtotal ?? 0) + quotationItems - (order?.discount ?? 0);

  await prisma.workOrder.update({
    where: { id: params.id },
    data: { quotationItems, total },
  });

  return Response.json({ success: true });
}
