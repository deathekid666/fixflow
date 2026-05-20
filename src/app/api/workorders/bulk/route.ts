import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["RECEIVED", "DIAGNOSING", "REPAIRING", "DONE", "DELIVERED", "CANCELLED"];

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { ids, status } = await req.json();

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return Response.json({ error: "ids array required" }, { status: 400 });
  }

  if (!VALID_STATUSES.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const tatUpdate: Record<string, Date> = {};
  if (status === "DONE") tatUpdate.doneAt = new Date();
  if (status === "DELIVERED") tatUpdate.deliveredAt = new Date();

  await prisma.workOrder.updateMany({
    where: {
      id: { in: ids },
      shopId: user.shopId ?? undefined,
    },
    data: { status, updatedAt: new Date(), ...tatUpdate },
  });

  await Promise.all(ids.map((id: string) =>
    prisma.operationLog.create({
      data: {
        action: "BULK_STATUS_CHANGED",
        description: `Bulk status changed to ${status}`,
        workOrderId: id,
        userId: user.id,
      },
    })
  ));

  return Response.json({ success: true, updated: ids.length });
}