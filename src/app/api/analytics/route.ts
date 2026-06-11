import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const shopFilter = user.shopId ? { shopId: user.shopId } : {};

  const [total, received, diagnosing, repairing, done, delivered, cancelled] = await Promise.all([
    prisma.workOrder.count({ where: shopFilter }),
    prisma.workOrder.count({ where: { ...shopFilter, status: "RECEIVED" } }),
    prisma.workOrder.count({ where: { ...shopFilter, status: "DIAGNOSING" } }),
    prisma.workOrder.count({ where: { ...shopFilter, status: "REPAIRING" } }),
    prisma.workOrder.count({ where: { ...shopFilter, status: "DONE" } }),
    prisma.workOrder.count({ where: { ...shopFilter, status: "DELIVERED" } }),
    prisma.workOrder.count({ where: { ...shopFilter, status: "CANCELLED" } }),
  ]);

  const revenue = await prisma.workOrder.aggregate({
    where: shopFilter,
    _sum: { collected: true, total: true },
  });

  const topParts = await prisma.workOrderPart.groupBy({
    by: ["sparePartId"],
    where: { workOrder: shopFilter },
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });

  const topPartsWithNames = await Promise.all(
    topParts.map(async (p) => {
      const part = await prisma.sparePart.findUnique({
        where: { id: p.sparePartId },
        select: { name: true, partNumber: true },
      });
      return { ...p, part };
    })
  );

  // Engineer performance
  const engineers = await prisma.user.findMany({
    where: { shopId: user.shopId ?? undefined, role: "ENGINEER" },
    select: { id: true, name: true },
  });

  const engineerStats = await Promise.all(
    engineers.map(async (eng) => {
      const completed = await prisma.workOrder.count({
        where: { ...shopFilter, assignedTo: eng.id, status: { in: ["DONE", "DELIVERED"] } },
      });
      const total = await prisma.workOrder.count({
        where: { ...shopFilter, assignedTo: eng.id },
      });
      const bounces = await prisma.bounceRepair.count({
        where: { workOrder: { ...shopFilter, assignedTo: eng.id } },
      });

      // Average TAT for completed orders
      const completedOrders = await prisma.workOrder.findMany({
        where: { ...shopFilter, assignedTo: eng.id, doneAt: { not: null } },
        select: { receivedAt: true, doneAt: true },
      });
      const avgTat = completedOrders.length > 0
        ? completedOrders.reduce((sum, o) => {
            const days = (new Date(o.doneAt!).getTime() - new Date(o.receivedAt).getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / completedOrders.length
        : 0;

      return { ...eng, completed, total, bounces, avgTat: Math.round(avgTat * 10) / 10 };
    })
  );

  // Low stock parts
  const lowStock = await prisma.sparePart.findMany({
    where: { shopId: user.shopId ?? undefined, stock: { lte: 5 } },
    select: { id: true, name: true, partNumber: true, stock: true, unitPrice: true },
    orderBy: { stock: "asc" },
  });

  // Loyalty milestones
  const now = new Date();
  const allFirstOrders = await prisma.workOrder.groupBy({
    by: ["customerPhone"],
    where: shopFilter,
    _min: { createdAt: true },
  });
  const anniversaryThisMonth = allFirstOrders.filter(c => {
    const d = c._min.createdAt;
    return d && d.getMonth() === now.getMonth() && d.getFullYear() < now.getFullYear();
  }).length;

  const orderCountsByPhone = await prisma.workOrder.groupBy({
    by: ["customerPhone"],
    where: shopFilter,
    _count: { id: true },
  });
  const tenPlusCount = orderCountsByPhone.filter(c => (c._count.id) >= 10).length;
  const goldCount = orderCountsByPhone.filter(c => (c._count.id) >= 6).length;

  // SLA compliance — for completed/delivered orders that had a deadline
  const slaOrders = await prisma.workOrder.findMany({
    where: { ...shopFilter, slaDeadline: { not: null }, status: { in: ["DONE", "DELIVERED"] } },
    select: { slaDeadline: true, doneAt: true, deliveredAt: true, completedAt: true },
  });
  const slaTotal = slaOrders.length;
  const slaMet = slaOrders.filter(o => {
    const finishedAt = o.completedAt ?? o.doneAt ?? o.deliveredAt;
    if (!finishedAt) return false;
    return new Date(finishedAt) <= new Date(o.slaDeadline!);
  }).length;
  const slaBreached = slaTotal - slaMet;
  const slaCompliance = slaTotal > 0 ? Math.round((slaMet / slaTotal) * 100) : null;

  return Response.json({
    orders: { total, received, diagnosing, repairing, done, delivered, cancelled },
    revenue: {
      total: revenue._sum.total ?? 0,
      collected: revenue._sum.collected ?? 0,
      outstanding: (revenue._sum.total ?? 0) - (revenue._sum.collected ?? 0),
    },
    topParts: topPartsWithNames,
    engineerStats,
    lowStock,
    sla: { total: slaTotal, met: slaMet, breached: slaBreached, compliance: slaCompliance },
    milestones: { anniversaryThisMonth, tenPlusCustomers: tenPlusCount, goldCustomers: goldCount },
  });
}
