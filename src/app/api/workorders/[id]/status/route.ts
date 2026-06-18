import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { buildMessage, sendNotification, shouldNotify, APP_URL, type NotifiableStatus, type SmsLang, type SmsProvider } from "@/lib/smsService";
import { recalculateCertification } from "@/lib/certification";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["RECEIVED", "DIAGNOSING", "REPAIRING", "DONE", "DELIVERED", "CANCELLED"];
const NOTIFIABLE: NotifiableStatus[] = ["DIAGNOSING", "REPAIRING", "DONE", "DELIVERED", "CANCELLED"];

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json();
  if (!status || !VALID_STATUSES.includes(status))
    return Response.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });

  const order = await prisma.workOrder.findFirst({
    where: { id: params.id, shopId: user.role !== "ADMIN" ? (user.shopId ?? undefined) : undefined },
    include: { shop: { select: { name: true } } },
  });
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const wasDelivered = order.status === "DELIVERED";
  const isNowDelivered = status === "DELIVERED";
  const isNowDone = status === "DONE";
  const autoStartTimer = status === "REPAIRING" && !order.startedAt;
  const autoStopTimer = status === "DONE" && !!order.startedAt && !order.completedAt;
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
      data: { action: "TIMER_STARTED", description: "Repair timer started", workOrderId: order.id, userId: user.id },
    });
  }

  if (autoStopTimer) {
    const durationMs = now.getTime() - order.startedAt!.getTime();
    await prisma.operationLog.create({
      data: { action: "TIMER_STOPPED", description: `Repair timer stopped · ${formatDuration(durationMs)}`, workOrderId: order.id, userId: user.id },
    });
  }

  // In-app notification for delivered
  if (isNowDelivered && !wasDelivered) {
    await prisma.notification.create({
      data: {
        type: "DELIVERED",
        message: `Work order #${order.orderNumber} marked as delivered.`,
        workOrderId: order.id,
        userId: order.assignedTo ?? order.userId,
      },
    });
  }

  // Certification recalc
  if ((isNowDelivered || isNowDone) && order.shopId) {
    recalculateCertification(order.shopId).catch(() => {});
  }

  // Auto-save pricing data when order is delivered
  if (isNowDelivered && !wasDelivered && order.shopId && order.total > 0 && order.repairType) {
    prisma.repairPrice.create({
      data: {
        shopId: order.shopId,
        deviceBrand: order.deviceBrand,
        deviceModel: order.deviceModel,
        repairType: order.repairType,
        price: order.total,
        acceptedByCustomer: true,
      },
    }).catch(() => {});
  }

  // ── Customer SMS / WhatsApp notification ──────────────────────────────────
  const isNotifiable = (NOTIFIABLE as string[]).includes(status);
  if (isNotifiable && order.customerPhone && order.shopId) {
    // Fire-and-forget — don't block the response
    (async () => {
      try {
        const settings = await prisma.shopSettings.findUnique({ where: { shopId: order.shopId! } });
        if (!settings?.smsEnabled) return;
        if (!shouldNotify(status, settings.notifyStatuses)) return;

        const trackingUrl = settings.includeTrackingLink
          ? `${APP_URL}/track/${order.orderNumber}`
          : undefined;

        const message = buildMessage(
          status as NotifiableStatus,
          {
            customerName: order.customerName,
            deviceBrand: order.deviceBrand,
            deviceModel: order.deviceModel,
            orderNumber: order.orderNumber,
            shopName: order.shop?.name ?? "your repair shop",
            trackingUrl,
          },
          (settings.smsLanguage as SmsLang) ?? "en",
        );

        const result = await sendNotification(order.customerPhone, message, settings.smsProvider as SmsProvider);

        await prisma.smsNotification.create({
          data: {
            workOrderId: order.id,
            phone: order.customerPhone,
            message,
            status: result.success ? "sent" : "failed",
            provider: result.provider,
            sentAt: result.success ? new Date() : null,
          },
        });
      } catch (err) {
        console.error("[SMS] Notification error:", err);
      }
    })();
  }

  return Response.json(updated);
}
