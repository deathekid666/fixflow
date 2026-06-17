import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { checkPerm } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.workOrder.findFirst({
    where: { id: params.id, shopId: user.shopId ?? undefined },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      shop: { select: { id: true, name: true, phone: true, whatsappPhone: true, address: true, email: true, logoUrl: true, currency: true, certification: true } },
      parts: {
        include: { sparePart: { select: { id: true, name: true, partNumber: true } } },
      },
      lineItems: { orderBy: { createdAt: "asc" } },
      logs: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      attachments: {
        select: { id: true, filename: true, path: true, tag: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      bounces: { orderBy: { createdAt: "asc" } },
      notes: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      rating: true,
      payments: {
        include: { collector: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      checklist: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  const start = new Date(order.receivedAt);
  const end = order.deliveredAt ? new Date(order.deliveredAt) : order.doneAt ? new Date(order.doneAt) : new Date();
  const tatDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = tatDays > 3 && !["DONE", "DELIVERED", "CANCELLED"].includes(order.status);

  const customerOrderCount = await prisma.workOrder.count({
    where: { customerPhone: order.customerPhone, shopId: order.shopId },
  });

  const customerFirstOrder = await prisma.workOrder.findFirst({
    where: { customerPhone: order.customerPhone, shopId: order.shopId },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  const customerFirstVisit = customerFirstOrder?.createdAt ?? order.createdAt;

  const canViewFinancials = await checkPerm(user.shopId, user.role, "VIEW_FINANCIALS");
  const responseOrder = canViewFinancials ? order : {
    ...order,
    subtotal: null, quotationItems: null, discount: null,
    total: null, collected: null, quotationRemarks: null,
    payments: [],
  };

  return Response.json({ ...responseOrder, tatDays, isOverdue, customerOrderCount, customerFirstVisit });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.workOrder.findFirst({
    where: { id: params.id, shopId: user.shopId ?? undefined },
  });
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  const updated = await prisma.workOrder.update({
    where: { id: params.id },
    data: {
      ...body,
      warrantyStart: body.warrantyStart ? new Date(body.warrantyStart) : undefined,
      warrantyEnd: body.warrantyEnd ? new Date(body.warrantyEnd) : undefined,
      updatedAt: new Date(),
    },
  });

  await prisma.operationLog.create({
    data: {
      action: "UPDATED",
      description: "Work order updated",
      workOrderId: params.id,
      userId: user.id,
    },
  });

  return Response.json(updated);
}