import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: "received and logged",
  DIAGNOSING: "being diagnosed",
  REPAIRING: "currently being repaired",
  DONE: "ready for pickup",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

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
      customerName: true, customerPhone: true, deviceBrand: true, deviceModel: true,
      faultDescription: true, status: true, createdAt: true, total: true, collected: true,
      notes: {
        select: { message: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      shop: { select: { name: true } },
    },
  });
  if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

  const tatDays = Math.ceil((Date.now() - new Date(order.createdAt).getTime()) / 86400000);
  const statusLabel = STATUS_LABELS[order.status] ?? order.status;
  const latestNote = order.notes[0]?.message ?? null;
  const firstName = order.customerName.split(" ")[0];
  const outstanding = order.total - order.collected;

  const prompt = `Draft a professional, friendly WhatsApp message for this repair update.

Customer first name: ${firstName}
Device: ${order.deviceBrand} ${order.deviceModel}
Issue: ${order.faultDescription}
Status: ${statusLabel}
Days in shop: ${tatDays}
Shop name: ${order.shop.name}
${latestNote ? `Latest technician note: ${latestNote.slice(0, 100)}` : ""}
${order.status === "DONE" && outstanding > 0 ? `Amount due on pickup: ${outstanding.toFixed(0)}` : ""}

Rules:
- Start directly with the message body (no "Here is the message:" preamble)
- Max 80 words
- Friendly but professional tone
- If status is DONE, make it enthusiastic about the repair being complete
- Include a clear call-to-action based on the status
- Don't use excessive emojis (1-2 max)
- Sign off with the shop name

Write only the message text, nothing else.`;

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
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      console.error("[draft-message] Claude API error:", resp.status, errBody);
      return Response.json({ error: errBody?.error?.message ?? "Claude API error" }, { status: 500 });
    }

    const data = await resp.json();
    const message = data.content?.[0]?.text?.trim() ?? "";
    return Response.json({ message, customerPhone: order.customerPhone, customerName: order.customerName });
  } catch (err) {
    console.error("[draft-message] Failed to reach Claude API:", err);
    return Response.json({ error: "Failed to reach AI" }, { status: 500 });
  }
}
