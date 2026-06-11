import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || user.shopId !== params.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.shopSettings.findUnique({
    where: { shopId: params.id },
    select: { defaultSlaHours: true },
  });

  return Response.json({ defaultSlaHours: settings?.defaultSlaHours ?? 24 });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || user.role !== "ADMIN" || user.shopId !== params.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { defaultSlaHours } = body;

  if (typeof defaultSlaHours !== "number" || defaultSlaHours < 1)
    return Response.json({ error: "Invalid defaultSlaHours" }, { status: 400 });

  const settings = await prisma.shopSettings.upsert({
    where: { shopId: params.id },
    update: { defaultSlaHours },
    create: { shopId: params.id, defaultSlaHours },
    select: { defaultSlaHours: true },
  });

  return Response.json({ defaultSlaHours: settings.defaultSlaHours });
}
