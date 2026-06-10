import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "AI not configured" }, { status: 503 });

  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid request" }, { status: 400 });

  const { brand, model, faultDescription } = body as Record<string, string>;
  if (!brand?.trim() || !model?.trim() || !faultDescription?.trim()) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system:
        "You are a mobile device repair expert. Respond ONLY with a valid JSON object — no markdown, no code blocks, no explanation.",
      messages: [
        {
          role: "user",
          content: `Device: ${brand} ${model}
Reported fault: ${faultDescription}

Return a JSON object estimating this repair:
{
  "duration": "e.g. 1-2 hours",
  "parts": ["up to 3 part names"],
  "costRange": "e.g. 200-500 MAD",
  "successRate": 85
}

successRate is an integer 0-100. Be realistic and concise.`,
        },
      ],
    }),
  }).catch(() => null);

  if (!res || !res.ok) {
    return Response.json({ error: "AI service unavailable" }, { status: 502 });
  }

  const data = await res.json().catch(() => null);
  const text: string = data?.content?.[0]?.text ?? "";

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found");
    const estimate = JSON.parse(match[0]) as {
      duration: string;
      parts: string[];
      costRange: string;
      successRate: number;
    };
    // Validate shape
    if (!estimate.duration || !Array.isArray(estimate.parts) || !estimate.costRange || typeof estimate.successRate !== "number") {
      throw new Error("Invalid shape");
    }
    estimate.successRate = Math.max(0, Math.min(100, Math.round(estimate.successRate)));
    estimate.parts = estimate.parts.slice(0, 3);
    return Response.json(estimate);
  } catch {
    return Response.json({ error: "Could not parse AI response" }, { status: 500 });
  }
}
