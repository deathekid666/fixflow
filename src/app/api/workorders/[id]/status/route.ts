// src/app/api/workorders/[id]/status/route.ts
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { smsService } from "@/lib/smsService";

export const dynamic = "force-dynamic";

const VALID_STATUSES = [
  "RECEIVED",
  "DIAGNOSING",
  "WAITING_PARTS",
  "IN_REPAIR",
  "READY",
  "DELIVERED",
  "CANCELLED",
];

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json();

  if (!status || !VALID_STATUSES.includes(status)) {
    return Response.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const order = await prisma.workOrder.findUnique({
    where: { id: params.id },
  });

  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  // Shop scope — non-admins can only update their own shop's orders
  if (user.role !== "ADMIN" && order.shopId !== user.shopId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const wasDelivered = order.status === "DELIVERED";
  const isNowDelivered = status === "DELIVERED";

  const updated = await prisma.workOrder.update({
    where: { id: params.id },
    data: {
      status,
      ...(isNowDelivered && !wasDelivered ? { deliveredAt: new Date() } : {}),
      ...(status === "READY" && !order.doneAt ? { doneAt: new Date() } : {}),
    },
  });

  // Log the status change
  await prisma.operationLog.create({
    data: {
      action: "STATUS_CHANGED",
      description: `Status changed from ${order.status} to ${status}`,
      workOrderId: order.id,
      userId: user.id,
    },
  });

  // ── DELIVERED trigger ────────────────────────────────────────────────────
  if (isNowDelivered && !wasDelivered) {
    // 1. Send SMS if customer has a phone number
    if (order.customerPhone) {
      const message = smsService.buildDeliveryMessage(
        order.customerName,
        order.orderNumber,
        order.deviceModel
      );
      const result = await smsService.send(order.customerPhone, message);

      await prisma.smsNotification.create({
        data: {
          workOrderId: order.id,
          phone: order.customerPhone,
          message,
          status: result.success ? "sent" : "failed",
          provider: "mock",
          sentAt: result.success ? new Date() : null,
        },
      });
    }

    // 2. Create in-app notification for the assignee/creator
    await prisma.notification.create({
      data: {
        type: "DELIVERED",
        message: `Work order #${order.orderNumber} marked as delivered.`,
        workOrderId: order.id,
        userId: order.assignedTo ?? order.userId,
      },
    });
    // Rating is collected via frontend — see RatingModal component
  }

  return Response.json(updated);
}
