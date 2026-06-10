import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const allMessages = await prisma.customerMessage.findMany({
    where: { workOrder: { shopId: user.shopId } },
    orderBy: { createdAt: "desc" },
    include: {
      workOrder: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          deviceBrand: true,
          deviceModel: true,
          status: true,
        },
      },
    },
  });

  // One entry per work order — most recent message
  const seen = new Set<string>();
  const conversations = allMessages.filter(m => {
    if (seen.has(m.workOrderId)) return false;
    seen.add(m.workOrderId);
    return true;
  });

  return Response.json(conversations);
}
