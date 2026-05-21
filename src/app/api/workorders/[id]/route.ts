// src/app/api/workorders/[id]/status/route.ts
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { smsService } from "@/lib/smsService";

export const dynamic = "force-dynamic";

// Matches the exact status values used in your existing page.tsx
const VALID_STATUSES = [
  "RECEIVED",
  "DIAGNOSING",
  "REPAIRING",
  "DONE",
  "DELIVERED",
  "CANCELLED",
];

// Your existing page calls this with POST — keeping POST
export async function POST(
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

  const order = await prisma.workOrder.findFirst({
    where: {
      id: params.id,
      shopId: user.role !== "ADMIN" ? (user.shopId ?? undefined) : undefined,
    },
  });

  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  const wasDelivered = order.status === "DELIVERED";
  const isNowDelivered = status === "DELIVERED";
  const isNowDone = status === "DONE";

  const updated = await prisma.workOrder.update({
    where: { id: params.id },
    data: {
      status,
      updatedAt: new Date(),
      ...(isNowDelivered && !wasDelivered ? { deliveredAt: new Date() } : {}),
      ...(isNowDone && !order.doneAt ? { doneAt: new Date() } : {}),
    },
  });

  await prisma.operationLog.create({
    data: {
      action: "STATUS_CHANGED",
      description: `Status changed from ${order.status} to ${status}`,
      workOrderId: order.id,
      userId: user.id,
    },
  });

  // DELIVERED trigger
  if (isNowDelivered && !wasDelivered) {
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

    await prisma.notification.create({
      data: {
        type: "DELIVERED",
        message: `Work order #${order.orderNumber} marked as delivered.`,
        workOrderId: order.id,
        userId: order.assignedTo ?? order.userId,
      },
    });
  }

  return Response.json(updated);
}
