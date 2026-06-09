import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

async function getMonthStats(shopFilter: object, from: Date, to: Date) {
  const [orders, expensesAgg] = await Promise.all([
    prisma.workOrder.findMany({
      where: { ...shopFilter, createdAt: { gte: from, lte: to } },
      select: { total: true, collected: true },
    }),
    prisma.expense.aggregate({
      where: { ...(shopFilter as { shopId?: string }), date: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
  ]);

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const collected = orders.reduce((s, o) => s + o.collected, 0);
  const expenses = expensesAgg._sum.amount ?? 0;

  return {
    orders: orders.length,
    revenue,
    collected,
    expenses,
    collectionRate: revenue > 0 ? Math.round((collected / revenue) * 100) : 0,
    profit: collected - expenses,
  };
}

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const shopFilter = user.shopId ? { shopId: user.shopId } : {};
  const now = new Date();

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEnd = now;

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [thisMonth, lastMonth] = await Promise.all([
    getMonthStats(shopFilter, thisMonthStart, thisMonthEnd),
    getMonthStats(shopFilter, lastMonthStart, lastMonthEnd),
  ]);

  return Response.json({ thisMonth, lastMonth });
}
