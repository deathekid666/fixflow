import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const shopFilter = user.shopId ? { shopId: user.shopId } : {};
  const dateFilter = from && to ? {
    createdAt: { gte: new Date(from), lte: new Date(to) },
  } : {};

  // Parts consumption grouped by spare part
  const usage = await prisma.workOrderPart.groupBy({
    by: ["sparePartId"],
    where: { workOrder: { ...shopFilter, ...dateFilter } },
    _sum: { quantity: true, total: true },
    _count: { id: true },
    orderBy: { _sum: { quantity: "desc" } },
  });

  const usageWithDetails = await Promise.all(
    usage.map(async (u) => {
      const part = await prisma.sparePart.findUnique({
        where: { id: u.sparePartId },
        select: { name: true, partNumber: true, unitPrice: true, stock: true },
      });
      return { ...u, part };
    })
  );

  // Total cost and revenue
  const totals = await prisma.workOrderPart.aggregate({
    where: { workOrder: { ...shopFilter, ...dateFilter } },
    _sum: { quantity: true, total: true },
  });

  // Stock adjustments in period
  const adjustments = await prisma.stockAdjustment.findMany({
    where: {
      sparePart: shopFilter,
      ...(from && to ? { createdAt: { gte: new Date(from), lte: new Date(to) } } : {}),
    },
    include: {
      user: { select: { name: true } },
      sparePart: { select: { name: true, partNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json({
    usage: usageWithDetails,
    totals: {
      totalQuantity: totals._sum.quantity ?? 0,
      totalRevenue: totals._sum.total ?? 0,
    },
    adjustments,
  });
}
