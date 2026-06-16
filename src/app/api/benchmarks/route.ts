import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const shopId = user.shopId;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // ── This shop's metrics ────────────────────────────────────────────────────

  const [shopDelivered, shopAgg, shopBounceCount, shopCustomerPhones] = await Promise.all([
    prisma.workOrder.findMany({
      where: { shopId, status: "DELIVERED", deliveredAt: { not: null } },
      select: { receivedAt: true, deliveredAt: true },
    }),
    prisma.workOrder.aggregate({
      where: { shopId },
      _avg: { total: true },
      _sum: { total: true, collected: true },
      _count: { id: true },
    }),
    prisma.workOrder.count({ where: { shopId, isBounce: true } }),
    prisma.workOrder.findMany({
      where: { shopId, customerPhone: { not: "" } },
      select: { customerPhone: true },
    }),
  ]);

  const shopTAT =
    shopDelivered.length > 0
      ? shopDelivered.reduce((sum, o) => {
          return sum + (new Date(o.deliveredAt!).getTime() - new Date(o.receivedAt).getTime()) / 86400000;
        }, 0) / shopDelivered.length
      : 0;

  const shopTotalOrders = shopAgg._count.id;
  const shopAvgOrderValue = shopAgg._avg.total ?? 0;
  const shopBounceRate = shopTotalOrders > 0 ? (shopBounceCount / shopTotalOrders) * 100 : 0;
  const shopTotalRev = shopAgg._sum.total ?? 0;
  const shopTotalColl = shopAgg._sum.collected ?? 0;
  const shopCollectionRate = shopTotalRev > 0 ? (shopTotalColl / shopTotalRev) * 100 : 0;

  const shopPhoneMap = new Map<string, number>();
  for (const o of shopCustomerPhones) {
    if (o.customerPhone) shopPhoneMap.set(o.customerPhone, (shopPhoneMap.get(o.customerPhone) ?? 0) + 1);
  }
  const shopTotalCustomers = shopPhoneMap.size;
  const shopReturning = [...shopPhoneMap.values()].filter(n => n > 1).length;
  const shopReturnRate = shopTotalCustomers > 0 ? (shopReturning / shopTotalCustomers) * 100 : 0;

  // ── Industry metrics (all ACTIVE shops, anonymous) ─────────────────────────

  const totalShops = await prisma.shop.count({ where: { status: "ACTIVE" } });
  const MIN_SHOPS = 2; // show industry data only when enough shops exist

  let industry = {
    avgTat: 0, avgOrderValue: 0, bounceRate: 0,
    collectionRate: 0, returnRate: 0,
    totalShops, totalOrders: 0, hasEnoughData: false,
  };

  if (totalShops >= MIN_SHOPS) {
    const [indDelivered, indAgg, indBounceCount, indCustomerPhones] = await Promise.all([
      prisma.workOrder.findMany({
        where: { status: "DELIVERED", deliveredAt: { not: null }, shop: { status: "ACTIVE" } },
        select: { receivedAt: true, deliveredAt: true },
      }),
      prisma.workOrder.aggregate({
        where: { shop: { status: "ACTIVE" } },
        _avg: { total: true },
        _sum: { total: true, collected: true },
        _count: { id: true },
      }),
      prisma.workOrder.count({ where: { isBounce: true, shop: { status: "ACTIVE" } } }),
      prisma.workOrder.findMany({
        where: { customerPhone: { not: "" }, shop: { status: "ACTIVE" } },
        select: { customerPhone: true },
      }),
    ]);

    const indTAT =
      indDelivered.length > 0
        ? indDelivered.reduce((sum, o) => {
            return sum + (new Date(o.deliveredAt!).getTime() - new Date(o.receivedAt).getTime()) / 86400000;
          }, 0) / indDelivered.length
        : 0;

    const indTotal = indAgg._count.id;
    const indAvgOrderValue = indAgg._avg.total ?? 0;
    const indBounceRate = indTotal > 0 ? (indBounceCount / indTotal) * 100 : 0;
    const indTotalRev = indAgg._sum.total ?? 0;
    const indTotalColl = indAgg._sum.collected ?? 0;
    const indCollectionRate = indTotalRev > 0 ? (indTotalColl / indTotalRev) * 100 : 0;

    const indPhoneMap = new Map<string, number>();
    for (const o of indCustomerPhones) {
      if (o.customerPhone) indPhoneMap.set(o.customerPhone, (indPhoneMap.get(o.customerPhone) ?? 0) + 1);
    }
    const indTotalCustomers = indPhoneMap.size;
    const indReturning = [...indPhoneMap.values()].filter(n => n > 1).length;
    const indReturnRate = indTotalCustomers > 0 ? (indReturning / indTotalCustomers) * 100 : 0;

    industry = {
      avgTat: Math.round(indTAT * 10) / 10,
      avgOrderValue: Math.round(indAvgOrderValue * 100) / 100,
      bounceRate: Math.round(indBounceRate * 10) / 10,
      collectionRate: Math.round(indCollectionRate * 10) / 10,
      returnRate: Math.round(indReturnRate * 10) / 10,
      totalShops,
      totalOrders: indTotal,
      hasEnoughData: true,
    };
  }

  // ── Industry insights (this month, fully anonymous) ────────────────────────

  const [deviceCounts, serviceTypeCounts, repairTypeCounts, avgPricesRaw] = await Promise.all([
    prisma.workOrder.groupBy({
      by: ["deviceBrand"],
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
        shop: { status: "ACTIVE" },
        deviceBrand: { not: "" },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.workOrder.groupBy({
      by: ["serviceType"],
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
        shop: { status: "ACTIVE" },
        serviceType: { not: "" },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    prisma.workOrder.groupBy({
      by: ["repairType"],
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
        shop: { status: "ACTIVE" },
        repairType: { not: "" },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    prisma.workOrder.groupBy({
      by: ["serviceType"],
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
        shop: { status: "ACTIVE" },
        serviceType: { not: "" },
        total: { gt: 0 },
        status: { in: ["DONE", "DELIVERED"] },
      },
      _avg: { total: true },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
  ]);

  return Response.json({
    shop: {
      avgTat: Math.round(shopTAT * 10) / 10,
      avgOrderValue: Math.round(shopAvgOrderValue * 100) / 100,
      bounceRate: Math.round(shopBounceRate * 10) / 10,
      collectionRate: Math.round(shopCollectionRate * 10) / 10,
      returnRate: Math.round(shopReturnRate * 10) / 10,
      totalOrders: shopTotalOrders,
    },
    industry,
    insights: {
      topDevices: deviceCounts.map(d => ({ brand: d.deviceBrand, count: d._count.id })),
      commonFaults: [
        ...serviceTypeCounts.map(f => ({ label: f.serviceType, count: f._count.id })),
        ...repairTypeCounts
          .filter(r => !serviceTypeCounts.some(s => s.serviceType === r.repairType))
          .map(r => ({ label: r.repairType, count: r._count.id })),
      ]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      avgPrices: avgPricesRaw.map(s => ({
        service: s.serviceType,
        avgPrice: Math.round(s._avg.total ?? 0),
        count: s._count.id,
      })),
      month: monthStart.toLocaleString("default", { month: "long", year: "numeric" }),
    },
  });
}
