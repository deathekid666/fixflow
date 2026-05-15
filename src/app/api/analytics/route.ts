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

  return Response.json({
    orders: { total, received, diagnosing, repairing, done, delivered, cancelled },
    revenue: {
      total: revenue._sum.total ?? 0,
      collected: revenue._sum.collected ?? 0,
      outstanding: (revenue._sum.total ?? 0) - (revenue._sum.collected ?? 0),
    },
    topParts: topPartsWithNames,
  });
}
