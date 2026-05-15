import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["RECEIVED", "DIAGNOSING", "REPAIRING", "DONE", "DELIVERED", "CANCELLED"];

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json();

  if (!VALID_STATUSES.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await prisma.workOrder.findFirst({
    where: { id: params.id, shopId: user.shopId ?? undefined },
  });
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  // Set TAT timestamps
  const tatUpdate: Record<string, Date> = {};
  if (status === "DONE" && !order.doneAt) tatUpdate.doneAt = new Date();
  if (status === "DELIVERED" && !order.deliveredAt) tatUpdate.deliveredAt = new Date();

  const updated = await prisma.workOrder.update({
    where: { id: params.id },
    data: { status, updatedAt: new Date(), ...tatUpdate },
  });

  await prisma.operationLog.create({
    data: {
      action: "STATUS_CHANGED",
      description: `Status changed to ${status}`,
      workOrderId: params.id,
      userId: user.id,
    },
  });

  // Check repeat SN — notify if same SN was seen before
  if (order.serialNumber) {
    const previousOrders = await prisma.workOrder.count({
      where: {
        serialNumber: order.serialNumber,
        shopId: user.shopId ?? undefined,
        id: { not: params.id },
      },
    });

    if (previousOrders > 0) {
      const admins = await prisma.user.findMany({
        where: { shopId: user.shopId ?? undefined, role: "ADMIN" },
      });
      await Promise.all(admins.map(admin =>
        prisma.notification.create({
          data: {
            type: "REPEAT_SN",
            message: `🔁 Device SN ${order.serialNumber} has been seen ${previousOrders} time(s) before. Customer: ${order.customerName}`,
            workOrderId: params.id,
            userId: admin.id,
          },
        })
      ));
    }
  }

  // Check TAT overdue — if status is still open after 3 days
  const daysSinceReceived = (Date.now() - new Date(order.receivedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceReceived > 3 && !["DONE", "DELIVERED", "CANCELLED"].includes(status)) {
    const admins = await prisma.user.findMany({
      where: { shopId: user.shopId ?? undefined, role: "ADMIN" },
    });
    await Promise.all(admins.map(admin =>
      prisma.notification.create({
        data: {
          type: "TAT_OVERDUE",
          message: `⏰ Work order for ${order.deviceBrand} ${order.deviceModel} (${order.customerName}) is overdue — ${Math.floor(daysSinceReceived)} days since received`,
          workOrderId: params.id,
          userId: admin.id,
        },
      })
    ));
  }

  return Response.json(updated);
}
