import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.workOrder.findFirst({
    where: { id: params.id, shopId: user.shopId },
  });
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.workOrder.update({
    where: { id: params.id },
    data: { lastReminderAt: new Date() },
  });

  return Response.json({ lastReminderAt: updated.lastReminderAt });
}
