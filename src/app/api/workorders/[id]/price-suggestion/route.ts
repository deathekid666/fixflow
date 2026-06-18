import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

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
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 512,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find(b => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return Response.json({ error: "No response from AI" }, { status: 500 });
    }

    // Extract JSON from the response, stripping any surrounding text
    const raw = textBlock.text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return Response.json({ error: "Could not parse AI response" }, { status: 500 });

    const parsed = JSON.parse(jsonMatch[0]) as {
      suggestedMin: number;
      suggestedMax: number;
      marketAverage: number;
      reasoning: string;
      confidence: "HIGH" | "MEDIUM" | "LOW";
    };

    // Sanity-check the shape
    if (
      typeof parsed.suggestedMin !== "number" ||
      typeof parsed.suggestedMax !== "number" ||
      typeof parsed.marketAverage !== "number" ||
      !["HIGH", "MEDIUM", "LOW"].includes(parsed.confidence)
    ) {
      return Response.json({ error: "Invalid AI response structure" }, { status: 500 });
    }

    return Response.json({ ...parsed, currency });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI service error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
