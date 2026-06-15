import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

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
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return Response.json({ error: "No response from AI" }, { status: 500 });
    }

    let json;
    try {
      json = JSON.parse(textBlock.text.trim());
    } catch {
      const match = textBlock.text.match(/\{[\s\S]*\}/);
      if (!match) return Response.json({ error: "Could not parse AI response" }, { status: 500 });
      json = JSON.parse(match[0]);
    }

    return Response.json(json);
  } catch (err) {
    console.error("AI assist error:", err);
    return Response.json({ error: "AI service error" }, { status: 500 });
  }
}
