import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint, keys } = await req.json().catch(() => ({}));
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return Response.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: user.id },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: user.id },
  });

  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint } = await req.json().catch(() => ({}));
  if (!endpoint) return Response.json({ error: "endpoint required" }, { status: 400 });

  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
  return Response.json({ ok: true });
}
