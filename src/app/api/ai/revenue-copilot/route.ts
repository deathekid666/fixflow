import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "AI not configured" }, { status: 503 });

  const shopId = user.shopId!;
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);

  const [shop, orders, engineerStats, topParts, customerData] = await Promise.all([
    prisma.shop.findUnique({ where: { id: shopId }, select: { name: true, currency: true } }),
    prisma.workOrder.findMany({
      where: { shopId, createdAt: { gte: ninetyDaysAgo }, deletedAt: null },
      select: {
        status: true, total: true, collected: true, faultLevel: true,
        createdAt: true, doneAt: true, deviceBrand: true, deviceModel: true,
        faultDescription: true, repairType: true,
      },
    }),
    prisma.user.findMany({
      where: { shopId, role: "ENGINEER" },
      select: {
        name: true,
        assignedOrders: {
          where: { createdAt: { gte: ninetyDaysAgo }, status: { in: ["DONE", "DELIVERED"] } },
          select: { total: true },
        },
      },
    }),
    prisma.workOrderPart.findMany({
      where: { workOrder: { shopId, createdAt: { gte: ninetyDaysAgo } } },
      select: { sparePart: { select: { name: true } }, quantity: true, total: true },
      take: 100,
    }),
    prisma.workOrder.groupBy({
      by: ["customerPhone"],
      where: { shopId, createdAt: { gte: ninetyDaysAgo }, deletedAt: null },
      _count: { id: true },
    }),
  ]);

  const currency = shop?.currency ?? "MAD";
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalCollected = orders.reduce((s, o) => s + o.collected, 0);
  const delivered = orders.filter(o => o.status === "DELIVERED").length;
  const returnCustomers = customerData.filter(c => c._count.id > 1).length;
  const retentionRate = customerData.length > 0 ? Math.round((returnCustomers / customerData.length) * 100) : 0;

  // Revenue by day of week
  const dayRevenue: Record<string, { count: number; revenue: number }> = {};
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  for (const o of orders) {
    const day = dayNames[new Date(o.createdAt).getDay()];
    if (!dayRevenue[day]) dayRevenue[day] = { count: 0, revenue: 0 };
    dayRevenue[day].count++;
    dayRevenue[day].revenue += o.total;
  }

  // Top device brands
  const brandCounts: Record<string, number> = {};
  for (const o of orders) {
    brandCounts[o.deviceBrand] = (brandCounts[o.deviceBrand] ?? 0) + 1;
  }
  const topBrands = Object.entries(brandCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([b, c]) => `${b}: ${c} orders`).join(", ");

  // Revenue by month
  const monthRevenue: Record<string, number> = {};
  for (const o of orders) {
    const key = new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    monthRevenue[key] = (monthRevenue[key] ?? 0) + o.total;
  }
  const monthTrend = Object.entries(monthRevenue).slice(-3).map(([m, r]) => `${m}: ${r.toFixed(0)} ${currency}`).join(", ");

  const slowestDay = Object.entries(dayRevenue).sort((a, b) => a[1].count - b[1].count)[0];
  const busiestDay = Object.entries(dayRevenue).sort((a, b) => b[1].count - a[1].count)[0];

  const engineerSummary = engineerStats.map(e => {
    const rev = e.assignedOrders.reduce((s, o) => s + o.total, 0);
    return `  • ${e.name}: ${e.assignedOrders.length} orders completed, ${rev.toFixed(0)} ${currency} revenue`;
  }).join("\n") || "  No engineer data";

  const prompt = `You are FixFlow Copilot, a business analyst for ${shop?.name ?? "a phone repair shop"}.

Analyze 90 days of performance (last 90 days):

REVENUE:
- Total orders: ${totalOrders} | Delivered: ${delivered}
- Total revenue: ${totalRevenue.toFixed(0)} ${currency}
- Total collected: ${totalCollected.toFixed(0)} ${currency} (${totalOrders > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0}% collection rate)
- Monthly trend: ${monthTrend || "insufficient data"}

TRAFFIC:
- Busiest day: ${busiestDay ? `${busiestDay[0]} (${busiestDay[1].count} orders)` : "unknown"}
- Slowest day: ${slowestDay ? `${slowestDay[0]} (${slowestDay[1].count} orders)` : "unknown"}
- Top devices: ${topBrands || "no data"}

CUSTOMERS:
- Unique customers: ${customerData.length}
- Return customers (2+ orders): ${returnCustomers} (${retentionRate}% retention rate)

ENGINEERS:
${engineerSummary}

Write a business intelligence report using markdown with these exact sections:

## Top 3 Insights
Three specific, numbered insights derived from the data above.

## Slow Days Opportunity
Analysis of the slowest day(s) with one concrete idea to fill them.

## Most Profitable Focus
Based on the data, what repair types or device brands to prioritize.

## Customer Retention
Analysis of the ${retentionRate}% retention rate and one specific tactic to improve it.

## Action for This Month
One clear, specific action to increase revenue this month. Make it actionable, not vague.

Keep it concise — 2-3 sentences per section. Be direct and data-driven. Currency is ${currency}.`;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 700,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) return Response.json({ error: "Claude API error" }, { status: 500 });

    const data = await resp.json();
    const analysis = data.content?.[0]?.text ?? "";
    return Response.json({ analysis });
  } catch {
    return Response.json({ error: "Failed to reach AI" }, { status: 500 });
  }
}
