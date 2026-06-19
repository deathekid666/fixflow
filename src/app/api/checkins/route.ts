import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

// GET /api/checkins — today's check-ins: confirmed appointments + walk-ins
export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  const [appointments, walkIns] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        shopId: user.shopId,
        checkedInAt: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { checkedInAt: "asc" },
    }),
    prisma.walkIn.findMany({
      where: {
        shopId: user.shopId,
        checkedInAt: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { checkedInAt: "asc" },
    }),
  ]);

  return Response.json({ appointments, walkIns });
}
