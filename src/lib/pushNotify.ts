import webpush from "web-push";
import { prisma } from "@/lib/prisma";

function initVapid() {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL ?? "mailto:support@fixflow.ma",
    process.env.VAPID_PUBLIC_KEY ?? "",
    process.env.VAPID_PRIVATE_KEY ?? ""
  );
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function pushToUser(userId: string, payload: PushPayload) {
  initVapid();
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (!subs.length) return;

  const data = JSON.stringify({ icon: "/icons/pwa-icon.svg", badge: "/icons/pwa-icon.svg", ...payload });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          data
        );
      } catch (err: unknown) {
        // Subscription expired or invalid — clean it up
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
        }
      }
    })
  );
}

export async function pushToShop(shopId: string, payload: PushPayload) {
  const users = await prisma.user.findMany({ where: { shopId }, select: { id: true } });
  await Promise.allSettled(users.map((u) => pushToUser(u.id, payload)));
}
