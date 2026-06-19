import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "AI not configured" }, { status: 503 });

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: params.id },
    select: {
      deviceBrand: true,
      deviceModel: true,
      faultDescription: true,
      shopId: true,
    },
  });

  if (!workOrder) return Response.json({ error: "Not found" }, { status: 404 });

  const spareParts = await prisma.sparePart.findMany({
    where: { shopId: workOrder.shopId },
    select: { name: true, partNumber: true, unitPrice: true, stock: true },
    orderBy: { name: "asc" },
  });

  const partsText =
    spareParts.length > 0
      ? spareParts
          .map((p) => `- ${p.name}${p.partNumber ? ` (${p.partNumber})` : ""} — ${p.unitPrice} — stock: ${p.stock}`)
          .join("\n")
      : "No parts in inventory.";

  const prompt = `You are an expert electronics repair technician. Analyze this repair job and provide structured guidance.

Device: ${workOrder.deviceBrand} ${workOrder.deviceModel}
Fault description: ${workOrder.faultDescription || "Not specified"}

Available shop inventory:
${partsText}

Respond with ONLY a valid JSON object (no markdown, no code fences) matching this exact structure:
{
  "likelyCause": "string — most probable root cause",
  "repairSteps": ["step 1", "step 2", "..."],
  "partsNeeded": [{"name": "part name", "quantity": 1, "note": "optional note"}],
  "estimatedTime": "e.g. 45 minutes",
  "successRate": "e.g. 90%",
  "commonMistakes": ["mistake 1", "mistake 2"],
  "suggestedPrice": {"min": 50, "max": 120},
  "difficulty": "Easy|Medium|Hard|Expert"
}

Only include parts from the available inventory when relevant. If no inventory parts apply, partsNeeded can be empty or list generic parts.`;

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
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      console.error("[ai-assist] Claude API error:", resp.status, errBody);
      return Response.json({ error: errBody?.error?.message ?? "AI service error" }, { status: 500 });
    }

    const data = await resp.json();
    const text = data.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";

    let json;
    try {
      json = JSON.parse(text.trim());
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return Response.json({ error: "Could not parse AI response" }, { status: 500 });
      json = JSON.parse(match[0]);
    }

    return Response.json(json);
  } catch (err) {
    console.error("[ai-assist] Failed to reach Claude API:", err);
    return Response.json({ error: "AI service error" }, { status: 500 });
  }
}
