import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { checkPerm } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!await checkPerm(user.shopId, user.role, "VIEW_FINANCIALS")) {
    return Response.json({ error: "Permission denied: VIEW_FINANCIALS" }, { status: 403 });
  }

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

  if (!await checkPerm(user.shopId, user.role, "RECORD_PAYMENTS")) {
    return Response.json({ error: "Permission denied: RECORD_PAYMENTS" }, { status: 403 });
  }

  const { amount, method, note } = await req.json();

  const amountNum = parseFloat(amount);
  if (Number.isNaN(amountNum) || amountNum <= 0 || amountNum > 1_000_000) {
    return Response.json({ error: "Amount must be between 0 and 1,000,000" }, { status: 400 });
  }

  const order = await prisma.workOrder.findFirst({
    where: { id: params.id, shopId: user.shopId ?? undefined },
    include: { payments: true },
  });

  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  const totalCollected = order.payments.reduce((s, p) => s + p.amount, 0) + amountNum;
  const calculatedTotal = order.subtotal + order.quotationItems - order.discount;
  const finalTotal = calculatedTotal > 0 ? calculatedTotal : order.total > 0 ? order.total : totalCollected;

  // Reject overpayment (allow 1% tolerance for rounding)
  if (finalTotal > 0 && totalCollected > finalTotal * 1.01) {
    return Response.json({ error: "Payment exceeds order total" }, { status: 400 });
  }

  const payment = await prisma.payment.create({
    data: {
      workOrderId: params.id,
      amount: amountNum,
      method: method ?? "CASH",
      note: note ?? null,
      collectedBy: user.id,
    },
    include: { collector: { select: { id: true, name: true } } },
  });

  await prisma.workOrder.update({
    where: { id: params.id },
    data: {
      collected: totalCollected,
      total: finalTotal,
      updatedAt: new Date(),
    },
  });

  await prisma.operationLog.create({
    data: {
      action: "PAYMENT_COLLECTED",
      description: `${amountNum.toFixed(2)} MAD collected via ${method ?? "CASH"}`,
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

  const order = await prisma.workOrder.findUnique({ where: { id: params.id } });
  const calculatedTotal = (order?.subtotal ?? 0) + (order?.quotationItems ?? 0) - (order?.discount ?? 0);
  const finalTotal = calculatedTotal > 0 ? calculatedTotal : order?.total ?? 0;

  await prisma.workOrder.update({
    where: { id: params.id },
    data: {
      collected: totalCollected,
      total: finalTotal,
    },
  });

  return Response.json({ message: "Deleted" });
}