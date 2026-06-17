import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

// GET — return current TV token (or null if not generated yet)
export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.shopSettings.findUnique({
    where: { shopId: user.shopId! },
    select: { tvToken: true },
  });

  return Response.json({ tvToken: settings?.tvToken ?? null });
}

// POST — generate a new TV token (or regenerate if already exists)
export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });

  const tvToken = "tv_" + randomBytes(24).toString("hex");

  const settings = await prisma.shopSettings.upsert({
    where: { shopId: user.shopId! },
    update: { tvToken },
    create: { shopId: user.shopId!, tvToken },
    select: { tvToken: true },
  });

  return Response.json({ tvToken: settings.tvToken });
}
