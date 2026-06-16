import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { smsService } from "@/lib/smsService";
import { recalculateCertification } from "@/lib/certification";

export const dynamic = "force-dynamic";

const VALID_STATUSES = [
  "RECEIVED",
  "DIAGNOSING",
  "REPAIRING",
  "DONE",
  "DELIVERED",
  "CANCELLED",
];

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

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

  const now = new Date();
  const wasDelivered = order.status === "DELIVERED";
  const isNowDelivered = status === "DELIVERED";
  const isNowDone = status === "DONE";
  const autoStartTimer = status === "REPAIRING" && !order.startedAt;
  const autoStopTimer = status === "DONE" && !!order.startedAt && !order.completedAt;
  // When a previously bounced order is completed again, clear the active bounce
  // flag so it isn't permanently locked. bounceCount remains as a historical record.
  const resolveBounce = isNowDone && order.isBounce;

  const updated = await prisma.workOrder.update({
    where: { id: params.id },
    data: {
      status,
      updatedAt: now,
      ...(isNowDelivered && !wasDelivered ? { deliveredAt: now } : {}),
      ...(isNowDone && !order.doneAt ? { doneAt: now } : {}),
      ...(autoStartTimer ? { startedAt: now } : {}),
      ...(autoStopTimer ? { completedAt: now } : {}),
      ...(resolveBounce ? { isBounce: false } : {}),
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

  if (autoStartTimer) {
    await prisma.operationLog.create({
      data: {
        action: "TIMER_STARTED",
        description: "Repair timer started",
        workOrderId: order.id,
        userId: user.id,
      },
    });
  }

  if (autoStopTimer) {
    const durationMs = now.getTime() - order.startedAt!.getTime();
    await prisma.operationLog.create({
      data: {
        action: "TIMER_STOPPED",
        description: `Repair timer stopped · ${formatDuration(durationMs)}`,
        workOrderId: order.id,
        userId: user.id,
      },
    });
  }

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

  // Recalculate certification whenever an order is completed/delivered
  if ((isNowDelivered || isNowDone) && order.shopId) {
    recalculateCertification(order.shopId).catch(() => {});
  }

  return Response.json(updated);
}