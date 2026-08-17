import { prisma } from "@/lib/prisma";

import { withApiError } from "@/lib/apiError";

export const dynamic = "force-dynamic";

// Public endpoint — no auth required. The cuid work order ID is unguessable.
export const GET = withApiError(async (_req: Request, { params }: { params: { id: string } }) => {
  const order = await prisma.workOrder.findUnique({
    where: { id: params.id },
    include: {
      creator: { select: { name: true } },
      assignee: { select: { name: true } },
      shop: {
        select: {
          name: true,
          phone: true,
          address: true,
          email: true,
          currency: true,
          certification: true,
        },
      },
      parts: {
        include: {
          sparePart: { select: { name: true, partNumber: true } },
        },
      },
      lineItems: { orderBy: { createdAt: "asc" } },
      payments: {
        select: { amount: true, method: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  const start = new Date(order.receivedAt);
  const end = order.deliveredAt
    ? new Date(order.deliveredAt)
    : order.doneAt
    ? new Date(order.doneAt)
    : new Date();
  const tatDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  return Response.json({ ...order, tatDays });
});
