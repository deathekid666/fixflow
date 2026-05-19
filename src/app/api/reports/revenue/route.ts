import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "monthly"; // daily, weekly, monthly

  const shopFilter = user.shopId ? { shopId: user.shopId } : {};

  // Get all work orders with dates and amounts
  const orders = await prisma.workOrder.findMany({
    where: shopFilter,
    select: {
      createdAt: true,
      total: true,
      collected: true,
      status: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by period
  const grouped: Record<string, { label: string; total: number; collected: number; count: number }> = {};

  for (const o of orders) {
    const d = new Date(o.createdAt);
    let key = "";
    let label = "";

    if (period === "daily") {
      key = d.toISOString().slice(0, 10);
      label = key;
    } else if (period === "weekly") {
      const startOfWeek = new Date(d);
      startOfWeek.setDate(d.getDate() - d.getDay());
      key = startOfWeek.toISOString().slice(0, 10);
      label = `Week of ${key}`;
    } else {
      key = d.toISOString().slice(0, 7);
      label = key;
    }

    if (!grouped[key]) grouped[key] = { label, total: 0, collected: 0, count: 0 };
    grouped[key].total += o.total;
    grouped[key].collected += o.collected;
    grouped[key].count += 1;
  }

  const data = Object.values(grouped);

  // Summary stats
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalCollected = orders.reduce((s, o) => s + o.collected, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return Response.json({ data, summary: { totalRevenue, totalCollected, totalOrders, avgOrderValue } });
}
