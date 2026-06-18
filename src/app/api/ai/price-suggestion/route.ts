import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "AI not configured" }, { status: 503 });

  const { deviceBrand, deviceModel, repairType, partsCost } = await req.json().catch(() => ({}));
  if (!repairType) return Response.json({ error: "repairType is required" }, { status: 400 });

  const shopId = user.shopId!;

  const [shop, history] = await Promise.all([
    prisma.shop.findUnique({ where: { id: shopId }, select: { name: true, currency: true, city: true, country: true } }),
    prisma.repairPrice.findMany({
      where: {
        shopId,
        repairType: { contains: repairType, mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const currency = shop?.currency ?? "MAD";
  const location = [shop?.city, shop?.country].filter(Boolean).join(", ") || "North Africa / Middle East";
  const pc = partsCost ?? 0;

  const historyBlock = history.length > 0
    ? history.map(h => `  • ${h.deviceBrand} ${h.deviceModel} — ${h.price.toFixed(0)} ${currency} (parts cost: ${h.partsCost.toFixed(0)})`).join("\n")
    : "  No historical data yet for this repair type.";

  const historyPrices = history.map(h => h.price);
  const historyAvg = historyPrices.length > 0 ? historyPrices.reduce((s, v) => s + v, 0) / historyPrices.length : null;
  const historyMin = historyPrices.length > 0 ? Math.min(...historyPrices) : null;
  const historyMax = historyPrices.length > 0 ? Math.max(...historyPrices) : null;

  const prompt = `You are a repair shop pricing expert. Given the repair details below, suggest an optimal price.

Device: ${deviceBrand ?? "Unknown"} ${deviceModel ?? "Unknown"}
Repair Type: ${repairType}
Parts cost (shop cost): ${pc.toFixed(0)} ${currency}
Shop location: ${location}
Currency: ${currency}

Your shop's historical pricing for similar repairs (${history.length} records):
${historyBlock}
${historyAvg !== null ? `Historical average: ${historyAvg.toFixed(0)} ${currency} (range: ${historyMin?.toFixed(0)}–${historyMax?.toFixed(0)} ${currency})` : ""}

Consider:
- Your shop's own historical prices (most important — consistency matters)
- Local market rates for ${location}
- Parts markup (typically 30–50% above cost)
- Labor time and complexity for this repair type
- A healthy profit margin (target 40–60% for standard repairs)

Respond ONLY with valid JSON, no markdown, no explanation:
{
  "suggestedPrice": <number, your recommended single price in ${currency}>,
  "priceRange": { "min": <number>, "max": <number> },
  "reasoning": "<2 sentence explanation>",
  "profitMargin": "<e.g. '~45% margin' or 'varies'>",
  "marketPosition": "<BUDGET|MARKET|PREMIUM>",
  "confidence": "<HIGH|MEDIUM|LOW>"
}`;

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
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) return Response.json({ error: "Claude API error" }, { status: 500 });

    const data = await resp.json();
    const raw = data.content?.[0]?.text?.trim() ?? "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return Response.json({ error: "Could not parse AI response" }, { status: 500 });

    const parsed = JSON.parse(jsonMatch[0]);
    return Response.json({ ...parsed, currency, historyCount: history.length });
  } catch {
    return Response.json({ error: "Failed to reach AI" }, { status: 500 });
  }
}
