import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    include: {
      workOrder: {
        select: {
          id: true,
          orderNumber: true,
          deviceBrand: true,
          deviceModel: true,
          customerName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json(notifications);
}

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { notificationId } = await req.json();

  await prisma.notification.updateMany({
    where: notificationId
      ? { id: notificationId, userId: user.id }
      : { userId: user.id },
    data: { read: true },
  });

  return Response.json({ success: true });
}
