import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { checkPerm } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!await checkPerm(user.shopId, user.role, "VIEW_REPORTS")) {
    return Response.json({ error: "Permission denied: VIEW_REPORTS" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const shopFilter = user.shopId ? { shopId: user.shopId, deletedAt: null } : { deletedAt: null };
  const dateFilter = {
    ...(from ? { gte: new Date(from + "T00:00:00.000Z") } : {}),
    ...(to   ? { lte: new Date(to   + "T23:59:59.999Z") } : {}),
  };

  const groups = await prisma.workOrder.groupBy({
    by: ["referralSource"],
    where: {
      ...shopFilter,
      ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
    },
    _count: { id: true },
    _sum: { collected: true, total: true },
  });

  const rows = groups.map(g => ({
    source: g.referralSource ?? "UNKNOWN",
    count: g._count.id,
    revenue: g._sum.collected ?? 0,
    quotedRevenue: g._sum.total ?? 0,
    avgOrderValue: g._count.id > 0 ? (g._sum.collected ?? 0) / g._count.id : 0,
  })).sort((a, b) => b.count - a.count);

  const totalOrders = rows.reduce((s, r) => s + r.count, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);

  return Response.json({ rows, totalOrders, totalRevenue });
}
