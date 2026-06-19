import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "AI not configured" }, { status: 503 });

  const [order, history] = await Promise.all([
    prisma.workOrder.findFirst({
      where: { id: params.id, shopId: user.shopId ?? undefined },
      include: {
        shop: { select: { name: true, country: true, city: true, currency: true } },
        parts: { include: { sparePart: { select: { name: true } } } },
      },
    }),
    user.shopId ? prisma.repairPrice.findMany({
      where: { shopId: user.shopId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }) : Promise.resolve([]),
  ]);
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  const repairType = order.repairType || order.serviceType || "General repair";
  const relevantHistory = history.filter(h =>
    h.repairType.toLowerCase().includes(repairType.toLowerCase()) ||
    repairType.toLowerCase().includes(h.repairType.toLowerCase())
  );
  const historyBlock = relevantHistory.length > 0
    ? relevantHistory.slice(0, 10).map(h => `  • ${h.deviceBrand} ${h.deviceModel} — ${h.price.toFixed(0)}`).join("\n")
    : "  No matching history in your shop.";

  const partsCost = order.parts.reduce((s, p) => s + p.total, 0);
  const servicesCost = order.quotationItems ?? 0;
  const currentTotal = order.total ?? 0;
  const currency = order.shop?.currency ?? "MAD";
  const location = [order.shop?.city, order.shop?.country].filter(Boolean).join(", ") || "North Africa / Middle East";
  const partsList = order.parts.map(p => `${p.sparePart.name} ×${p.quantity}`).join(", ");

  const prompt = `You are a repair shop pricing expert. Given the following repair job, suggest an optimal price range.

Device: ${order.deviceBrand} ${order.deviceModel}
Repair Type: ${repairType}
Fault: ${order.faultDescription || "Not specified"}
Parts used: ${partsList || "None logged"}
Parts cost (shop cost): ${partsCost.toFixed(2)} ${currency}
Labor/services already quoted: ${servicesCost.toFixed(2)} ${currency}
Current total set: ${currentTotal.toFixed(2)} ${currency}
Shop location: ${location}
Currency: ${currency}

Your shop's historical pricing for similar repairs:
${historyBlock}

Consider:
- Your shop's own historical prices first (consistency matters for trust)
- Local market rates for this type of repair in ${location}
- Parts markup (typically 30–50% for ${currency} markets)
- Labor time and complexity
- The fault level: ${order.faultLevel || "standard"}

Respond ONLY with valid JSON, no markdown, no explanation outside the JSON:
{
  "suggestedMin": <number, minimum fair price in ${currency}>,
  "suggestedMax": <number, maximum fair price in ${currency}>,
  "marketAverage": <number, typical market price for this repair in ${currency}>,
  "reasoning": "<2-3 sentence explanation of the pricing logic>",
  "confidence": "<HIGH if common repair with clear market data, MEDIUM if moderate uncertainty, LOW if unusual repair or limited data>"
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
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      console.error("[price-suggestion] Claude API error:", resp.status, errBody);
      return Response.json({ error: errBody?.error?.message ?? "AI service error" }, { status: 500 });
    }

    const data = await resp.json();
    const raw = data.content?.find((b: { type: string }) => b.type === "text")?.text?.trim() ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return Response.json({ error: "Could not parse AI response" }, { status: 500 });

    const parsed = JSON.parse(jsonMatch[0]) as {
      suggestedMin: number;
      suggestedMax: number;
      marketAverage: number;
      reasoning: string;
      confidence: "HIGH" | "MEDIUM" | "LOW";
    };

    if (
      typeof parsed.suggestedMin !== "number" ||
      typeof parsed.suggestedMax !== "number" ||
      typeof parsed.marketAverage !== "number" ||
      !["HIGH", "MEDIUM", "LOW"].includes(parsed.confidence)
    ) {
      return Response.json({ error: "Invalid AI response structure" }, { status: 500 });
    }

    return Response.json({ ...parsed, currency });
  } catch (err) {
    console.error("[price-suggestion] Failed to reach Claude API:", err);
    return Response.json({ error: "AI service error" }, { status: 500 });
  }
}
