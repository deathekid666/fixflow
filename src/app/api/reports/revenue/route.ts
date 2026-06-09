import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "monthly";
  const range = searchParams.get("range") ?? "all";

  const shopFilter = user.shopId ? { shopId: user.shopId } : {};

  const now = new Date();
  let fromDate: Date | null = null;
  if (range === "7d") fromDate = new Date(now.getTime() - 7 * 86400000);
  else if (range === "30d") fromDate = new Date(now.getTime() - 30 * 86400000);
  else if (range === "90d") fromDate = new Date(now.getTime() - 90 * 86400000);

  const orders = await prisma.workOrder.findMany({
    where: { ...shopFilter, ...(fromDate ? { createdAt: { gte: fromDate } } : {}) },
    select: { createdAt: true, total: true, collected: true, status: true },
    orderBy: { createdAt: "asc" },
  });

  const expenseRows = await prisma.expense.findMany({
    where: { shopId: user.shopId ?? undefined, ...(fromDate ? { date: { gte: fromDate } } : {}) },
    select: { date: true, amount: true },
  });

  function periodKey(d: Date): string {
    if (period === "daily") return d.toISOString().slice(0, 10);
    if (period === "weekly") {
      const sow = new Date(d);
      sow.setDate(d.getDate() - d.getDay());
      return sow.toISOString().slice(0, 10);
    }
    return d.toISOString().slice(0, 7);
  }

  function periodLabel(key: string): string {
    if (period === "weekly") return `Week of ${key}`;
    return key;
  }

  const grouped: Record<string, { label: string; total: number; collected: number; count: number }> = {};
  for (const o of orders) {
    const key = periodKey(new Date(o.createdAt));
    if (!grouped[key]) grouped[key] = { label: periodLabel(key), total: 0, collected: 0, count: 0 };
    grouped[key].total += o.total;
    grouped[key].collected += o.collected;
    grouped[key].count += 1;
  }

  const expByKey: Record<string, number> = {};
  for (const e of expenseRows) {
    const key = periodKey(new Date(e.date));
    expByKey[key] = (expByKey[key] ?? 0) + e.amount;
  }

  const data = Object.entries(grouped).map(([key, v]) => ({
    ...v,
    expenses: Math.round((expByKey[key] ?? 0) * 100) / 100,
    profit: Math.round((v.collected - (expByKey[key] ?? 0)) * 100) / 100,
  }));

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalCollected = orders.reduce((s, o) => s + o.collected, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalExpenses = expenseRows.reduce((s, e) => s + e.amount, 0);
  const profit = totalCollected - totalExpenses;

  return Response.json({
    data,
    summary: { totalRevenue, totalCollected, totalOrders, avgOrderValue, totalExpenses, profit },
  });
}
