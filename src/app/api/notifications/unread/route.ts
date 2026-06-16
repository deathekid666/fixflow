import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { createNotification, getShopAdminIds } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ count: 0 });

  const shopId = user.shopId;
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const adminIds = await getShopAdminIds(shopId);

  // ── SLA breach warnings (deadline within 2h and not yet notified today) ──
  const slaBreach = await prisma.workOrder.findMany({
    where: {
      shopId,
      slaDeadline: { gte: now, lte: new Date(now.getTime() + 2 * 60 * 60 * 1000) },
      status: { notIn: ["DELIVERED", "CANCELLED"] },
      deletedAt: null,
    },
    select: { id: true, orderNumber: true, slaDeadline: true },
  });

  for (const order of slaBreach) {
    for (const uid of adminIds) {
      const exists = await prisma.notification.findFirst({
        where: { userId: uid, type: "SLA_BREACH", workOrderId: order.id, createdAt: { gte: oneDayAgo } },
      });
      if (!exists) {
        const mins = Math.round((order.slaDeadline!.getTime() - now.getTime()) / 60000);
        await createNotification(
          uid,
          "SLA_BREACH",
          `SLA deadline in ${mins}m — ${order.orderNumber.slice(0, 8).toUpperCase()}`,
          { workOrderId: order.id, link: `/dashboard/workorders/${order.id}` }
        );
      }
    }
  }

  // ── Overdue orders (open > 7 days, no DELIVERED/CANCELLED) ──
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const overdueOrders = await prisma.workOrder.findMany({
    where: {
      shopId,
      createdAt: { lte: sevenDaysAgo },
      status: { notIn: ["DELIVERED", "CANCELLED"] },
      deletedAt: null,
    },
    select: { id: true, orderNumber: true, createdAt: true },
  });

  for (const order of overdueOrders) {
    for (const uid of adminIds) {
      const exists = await prisma.notification.findFirst({
        where: { userId: uid, type: "ORDER_OVERDUE", workOrderId: order.id, createdAt: { gte: oneDayAgo } },
      });
      if (!exists) {
        const days = Math.round((now.getTime() - order.createdAt.getTime()) / (24 * 60 * 60 * 1000));
        await createNotification(
          uid,
          "ORDER_OVERDUE",
          `Order open for ${days} days — ${order.orderNumber.slice(0, 8).toUpperCase()}`,
          { workOrderId: order.id, link: `/dashboard/workorders/${order.id}` }
        );
      }
    }
  }

  // ── Low stock alerts ──
  const lowStock = await prisma.sparePart.findMany({
    where: { shopId, stock: { lte: 5 } },
    select: { id: true, name: true, stock: true },
  });

  for (const part of lowStock) {
    const exists = await prisma.notification.findFirst({
      where: { userId: user.id, type: "LOW_STOCK", message: { contains: part.name }, createdAt: { gte: oneDayAgo } },
    });
    if (!exists) {
      await createNotification(
        user.id,
        "LOW_STOCK",
        `Low stock: ${part.name} (${part.stock} left)`,
        { link: "/dashboard/spareparts" }
      );
    }
  }

  const count = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  // Which sidebar items have unread activity
  const unreadMessages = await prisma.customerMessage.count({
    where: { senderType: "CUSTOMER", read: false, workOrder: { shopId } },
  });

  const pendingAppts = await prisma.appointment.count({
    where: { shopId, status: "PENDING" },
  });

  return Response.json({
    count,
    unreadMessages,
    pendingAppts,
    lowStockCount: lowStock.length,
  });
}
