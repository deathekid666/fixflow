import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const unread = await prisma.customerMessage.groupBy({
    by: ["workOrderId"],
    where: {
      workOrder: { shopId: user.shopId },
      senderType: "CUSTOMER",
      read: false,
    },
    _count: { id: true },
  });

  const result: Record<string, number> = {};
  for (const item of unread) {
    result[item.workOrderId] = item._count.id;
  }

  return Response.json(result);
}
