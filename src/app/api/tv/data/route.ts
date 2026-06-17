import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/tv/data?token=xxx — no session required, authenticated by shop TV token
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) return Response.json({ error: "Missing token" }, { status: 401 });

  const settings = await prisma.shopSettings.findUnique({
    where: { tvToken: token },
    select: { shopId: true },
  });

  if (!settings) return Response.json({ error: "Invalid token" }, { status: 401 });

  const { shopId } = settings;

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { id: true, name: true, logoUrl: true },
  });

  if (!shop) return Response.json({ error: "Shop not found" }, { status: 404 });

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Active repairs
  const activeOrders = await prisma.workOrder.findMany({
    where: { shopId, status: { in: ["RECEIVED", "IN_PROGRESS"] }, deletedAt: null },
    orderBy: [{ slaDeadline: "asc" }, { createdAt: "asc" }],
    take: 20,
    select: {
      id: true, orderNumber: true, status: true,
      customerName: true, deviceBrand: true, deviceModel: true,
      createdAt: true, slaDeadline: true, faultLevel: true,
      assignedTo: true,
    },
  });

  // Ready for pickup
  const readyOrders = await prisma.workOrder.findMany({
    where: { shopId, status: "DONE", deletedAt: null },
    orderBy: { updatedAt: "asc" },
    take: 20,
    select: {
      id: true, orderNumber: true,
      customerName: true, deviceBrand: true, deviceModel: true,
      updatedAt: true,
    },
  });

  // Today's stats
  const [receivedToday, completedToday] = await Promise.all([
    prisma.workOrder.count({
      where: { shopId, createdAt: { gte: todayStart, lte: todayEnd }, deletedAt: null },
    }),
    prisma.workOrder.count({
      where: { shopId, status: { in: ["DONE", "DELIVERED"] }, doneAt: { gte: todayStart, lte: todayEnd }, deletedAt: null },
    }),
  ]);

  const revenueResult = await prisma.workOrder.aggregate({
    where: { shopId, status: "DELIVERED", deliveredAt: { gte: todayStart, lte: todayEnd }, deletedAt: null },
    _sum: { collected: true },
  });
  const revenueToday = revenueResult._sum.collected ?? 0;

  // Total active + done
  const [totalActive, totalReady] = await Promise.all([
    prisma.workOrder.count({ where: { shopId, status: { in: ["RECEIVED", "IN_PROGRESS"] }, deletedAt: null } }),
    prisma.workOrder.count({ where: { shopId, status: "DONE", deletedAt: null } }),
  ]);

  // Today's appointments (next 5 upcoming)
  const appointments = await prisma.appointment.findMany({
    where: {
      shopId,
      scheduledAt: { gte: now, lte: todayEnd },
      status: { not: "CANCELLED" },
    },
    orderBy: { scheduledAt: "asc" },
    take: 5,
    select: {
      id: true, customerName: true, deviceBrand: true, deviceModel: true,
      scheduledAt: true, status: true, faultDescription: true,
    },
  });

  // Engineers with active orders
  const assignedUserIds = [...new Set(activeOrders.map(o => o.assignedTo).filter(Boolean))] as string[];
  const engineers = assignedUserIds.length
    ? await prisma.user.findMany({
        where: { id: { in: assignedUserIds } },
        select: { id: true, name: true },
      })
    : [];

  // Engineer → orders map
  const engineerWorkload: Record<string, { name: string; count: number; orders: string[] }> = {};
  for (const eng of engineers) {
    const orders = activeOrders.filter(o => o.assignedTo === eng.id);
    engineerWorkload[eng.id] = {
      name: eng.name ?? "Unknown",
      count: orders.length,
      orders: orders.map(o => `${o.orderNumber} — ${o.deviceBrand} ${o.deviceModel}`),
    };
  }

  // Also include engineers with 0 orders
  const allEngineers = await prisma.user.findMany({
    where: { shopId, role: "ENGINEER" },
    select: { id: true, name: true },
  });
  for (const eng of allEngineers) {
    if (!engineerWorkload[eng.id]) {
      engineerWorkload[eng.id] = { name: eng.name ?? "Unknown", count: 0, orders: [] };
    }
  }

  // Low stock alerts
  const lowStock = await prisma.sparePart.findMany({
    where: { shopId, stock: { lt: 5 } },
    orderBy: { stock: "asc" },
    take: 10,
    select: { id: true, name: true, partNumber: true, stock: true },
  });

  // Recent activity log for ticker (last 15)
  const activityLogs = await prisma.operationLog.findMany({
    where: { workOrder: { shopId } },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: {
      id: true, action: true, description: true, createdAt: true,
      workOrder: { select: { orderNumber: true, customerName: true } },
    },
  });

  return Response.json({
    shop,
    activeOrders,
    readyOrders,
    totalActive,
    totalReady,
    stats: { receivedToday, completedToday, revenueToday },
    appointments,
    engineerWorkload: Object.values(engineerWorkload),
    lowStock,
    activityLogs,
    generatedAt: now.toISOString(),
  });
}
