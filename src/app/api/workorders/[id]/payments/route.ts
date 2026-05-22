import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const payments = await prisma.payment.findMany({
    where: { workOrderId: params.id },
    include: { collector: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(payments);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, method, note } = await req.json();

  if (!amount || amount <= 0) {
    return Response.json({ error: "Amount must be greater than 0" }, { status: 400 });
  }

  const order = await prisma.workOrder.findFirst({
    where: { id: params.id, shopId: user.shopId ?? undefined },
    include: { payments: true },
  });

  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  const payment = await prisma.payment.create({
    data: {
      workOrderId: params.id,
      amount: parseFloat(amount),
      method: method ?? "CASH",
      note: note ?? null,
      collectedBy: user.id,
    },
    include: { collector: { select: { id: true, name: true } } },
  });

  const totalCollected = order.payments.reduce((s, p) => s + p.amount, 0) + parseFloat(amount);
  await prisma.workOrder.update({
    where: { id: params.id },
    data: { collected: totalCollected, updatedAt: new Date() },
  });

  await prisma.operationLog.create({
    data: {
      action: "PAYMENT_COLLECTED",
      description: `${parseFloat(amount).toFixed(2)} MAD collected via ${method ?? "CASH"}`,
      workOrderId: params.id,
      userId: user.id,
    },
  });

  return Response.json(payment, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { paymentId } = await req.json();
  if (!paymentId) return Response.json({ error: "paymentId required" }, { status: 400 });

  await prisma.payment.delete({ where: { id: paymentId } });

  const remaining = await prisma.payment.findMany({ where: { workOrderId: params.id } });
  const totalCollected = remaining.reduce((s, p) => s + p.amount, 0);
  await prisma.workOrder.update({
    where: { id: params.id },
    data: { collected: totalCollected },
  });

  return Response.json({ message: "Deleted" });
}