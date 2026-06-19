import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "AI not configured" }, { status: 503 });

  const { orderId } = await req.json().catch(() => ({} as Record<string, string>));
  if (!orderId) return Response.json({ error: "orderId required" }, { status: 400 });

  const order = await prisma.workOrder.findFirst({
    where: { id: orderId, shopId: user.shopId! },
    select: {
      orderNumber: true, deviceBrand: true, deviceModel: true, imei: true,
      faultDescription: true, status: true, faultLevel: true, createdAt: true,
      subtotal: true, total: true, assignee: { select: { name: true } },
      notes: { select: { message: true }, take: 3, orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

  const tatDays = Math.ceil((Date.now() - new Date(order.createdAt).getTime()) / 86400000);

  // Similar past orders — same device brand + model, delivered/done, last 12 months
  const pastOrders = await prisma.workOrder.findMany({
    where: {
      shopId: user.shopId!,
      deviceBrand: { equals: order.deviceBrand, mode: "insensitive" },
      deviceModel: { equals: order.deviceModel, mode: "insensitive" },
      status: { in: ["DONE", "DELIVERED"] },
      deletedAt: null,
      createdAt: { gte: new Date(Date.now() - 365 * 86400000) },
      id: { not: orderId },
    },
    select: {
      faultDescription: true, total: true, doneAt: true, createdAt: true,
    },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  const similarSummary = pastOrders.map(p => {
    const days = p.doneAt
      ? Math.ceil((new Date(p.doneAt).getTime() - new Date(p.createdAt).getTime()) / 86400000)
      : null;
    return `  • "${p.faultDescription.slice(0, 80)}" — ${days ? `${days} days` : "ongoing"}, total: ${p.total.toFixed(0)}`;
  }).join("\n") || "  No similar past orders in this shop.";

  const recentNotes = order.notes.map(n => `  "${n.message.slice(0, 100)}"`).join("\n") || "  None";

  const prompt = `You are FixFlow Copilot, a repair order analyst. Analyze this order and respond ONLY with valid JSON (no markdown, no explanation).

Order: ${order.orderNumber}
Device: ${order.deviceBrand} ${order.deviceModel}${order.imei ? ` (IMEI: ${order.imei})` : ""}
Fault: ${order.faultDescription}
Status: ${order.status} | Risk: ${order.faultLevel}
Days in shop: ${tatDays}
Engineer: ${order.assignee?.name ?? "unassigned"}
Price quoted: ${order.total > 0 ? order.total.toFixed(0) : "not quoted yet"}

Recent notes:
${recentNotes}

Similar past orders from this shop (${pastOrders.length} found):
${similarSummary}

Respond with exactly this JSON structure:
{
  "estimatedCompletion": "e.g. '1-2 more days' or 'should be done today'",
  "riskFactors": ["risk 1", "risk 2"],
  "suggestedMessage": "A short professional WhatsApp message to update the customer (max 60 words)",
  "priceSuggestion": 850
}

priceSuggestion should be a number based on past similar orders, or null if insufficient data.`;

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
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      console.error("[order-insights] Claude API error:", resp.status, errBody);
      return Response.json({ error: errBody?.error?.message ?? "Claude API error" }, { status: 500 });
    }

    const data = await resp.json();
    const raw = data.content?.[0]?.text ?? "{}";
    const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());
    return Response.json(parsed);
  } catch (err) {
    console.error("[order-insights] Failed to reach Claude API:", err);
    return Response.json({ error: "Failed to parse AI response — please retry" }, { status: 500 });
  }
}
