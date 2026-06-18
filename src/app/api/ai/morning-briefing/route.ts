import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "AI not configured — add ANTHROPIC_API_KEY" }, { status: 503 });

  const shopId = user.shopId!;
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const [
    activeOrders,
    overdueOrders,
    lowStock,
    todayAppts,
    last7Rev,
    prev7Rev,
    shop,
    recentPrices,
  ] = await Promise.all([
    prisma.workOrder.count({
      where: { shopId, status: { notIn: ["DELIVERED", "CANCELLED"] }, deletedAt: null },
    }),
    prisma.workOrder.findMany({
      where: { shopId, slaDeadline: { lt: now }, status: { notIn: ["DONE", "DELIVERED", "CANCELLED"] }, deletedAt: null },
      select: { orderNumber: true, customerName: true, deviceBrand: true, deviceModel: true, slaDeadline: true, status: true },
      take: 10,
    }),
    prisma.sparePart.findMany({
      where: { shopId, stock: { lt: 5 } },
      select: { name: true, stock: true },
      take: 10,
      orderBy: { stock: "asc" },
    }),
    prisma.appointment.count({
      where: { shopId, scheduledAt: { gte: todayStart, lte: todayEnd }, status: { not: "CANCELLED" } },
    }),
    prisma.workOrder.aggregate({
      where: { shopId, deliveredAt: { gte: sevenDaysAgo }, deletedAt: null },
      _sum: { collected: true },
    }),
    prisma.workOrder.aggregate({
      where: { shopId, deliveredAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo }, deletedAt: null },
      _sum: { collected: true },
    }),
    prisma.shop.findUnique({ where: { id: shopId }, select: { name: true, currency: true } }),
    prisma.repairPrice.groupBy({
      by: ["repairType"],
      where: { shopId, createdAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
      _avg: { price: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  const last7 = last7Rev._sum.collected ?? 0;
  const prev7 = prev7Rev._sum.collected ?? 0;
  const revChange = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : null;
  const currency = shop?.currency ?? "MAD";

  const overdueList = overdueOrders.map(o =>
    `  • ${o.orderNumber} — ${o.customerName} (${o.deviceBrand} ${o.deviceModel}) — ${o.status}`
  ).join("\n") || "  None";

  const stockList = lowStock.map(p => `  • ${p.name}: ${p.stock} units`).join("\n") || "  None";

  const pricingList = recentPrices.length > 0
    ? recentPrices.map(p => `  • ${p.repairType}: ${p._count.id} repairs done, avg price ${(p._avg.price ?? 0).toFixed(0)} ${currency}`).join("\n")
    : "  No pricing data recorded yet";

  const prompt = `You are FixFlow Copilot, a business intelligence assistant for ${shop?.name ?? "a phone repair shop"}.

Today is ${now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}.

Current situation:
- Active orders in queue: ${activeOrders}
- Overdue orders (past SLA deadline):
${overdueList}
- Low stock parts:
${stockList}
- Today's appointments: ${todayAppts}
- Revenue last 7 days: ${last7.toFixed(0)} ${currency}${revChange !== null ? ` (${revChange >= 0 ? "+" : ""}${revChange}% vs previous week)` : ""}
- Previous 7 days revenue: ${prev7.toFixed(0)} ${currency}
- Top repair types this month:
${pricingList}

Write a concise morning briefing with these four sections (use markdown):

## Urgent Items
What needs immediate attention today. Be specific — mention actual order numbers if overdue.

## Revenue Trend
One clear, direct insight about the revenue numbers. If the trend is good, say so. If bad, be honest.

## Pricing Insight
One observation about the pricing data (most done repairs, any opportunity to adjust prices). Skip this section if no pricing data is available.

## Today's Recommendation
One specific, actionable thing the owner should do today. Make it practical.

Keep each section to 2–3 sentences. Tone: direct, data-driven, helpful. No fluff.`;

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
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return Response.json({ error: err.error?.message ?? "Claude API error" }, { status: 500 });
    }

    const data = await resp.json();
    const briefing = data.content?.[0]?.text ?? "";
    return Response.json({ briefing });
  } catch {
    return Response.json({ error: "Failed to reach AI — check network" }, { status: 500 });
  }
}
