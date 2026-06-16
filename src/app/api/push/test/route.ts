import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { pushToUser } from "@/lib/pushNotify";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const subs = await prisma.pushSubscription.findMany({ where: { userId: user.id } });
  if (!subs.length) {
    return Response.json({ error: "No push subscription found for your account. Enable notifications in the dashboard first." }, { status: 404 });
  }

  await pushToUser(user.id, {
    title: "🔧 FixFlow Test",
    body: "Push notifications are working!",
    url: "/dashboard",
    tag: "push-test",
  });

  return Response.json({ ok: true, subscriptions: subs.length });
}
