import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);

  const logs = await prisma.operationLog.findMany({
    where: { workOrder: { shopId: user.shopId } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      workOrder: { select: { orderNumber: true, customerName: true } },
      user: { select: { name: true } },
    },
  });

  return Response.json(
    logs.map((l) => ({
      id: l.id,
      action: l.action,
      description: l.description,
      orderNumber: l.workOrder.orderNumber,
      customerName: l.workOrder.customerName,
      userName: l.user.name,
      createdAt: l.createdAt,
    }))
  );
}
