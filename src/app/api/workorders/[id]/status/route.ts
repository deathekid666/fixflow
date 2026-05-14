import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["RECEIVED", "DIAGNOSING", "REPAIRING", "DONE", "DELIVERED", "CANCELLED"];

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json();

  if (!VALID_STATUSES.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await prisma.workOrder.findFirst({
    where: { id: params.id, shopId: user.shopId ?? undefined },
  });

  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.workOrder.update({
    where: { id: params.id },
    data: { status, updatedAt: new Date() },
  });

  await prisma.operationLog.create({
    data: {
      action: "STATUS_CHANGED",
      description: `Status changed to ${status}`,
      workOrderId: params.id,
      userId: user.id,
    },
  });

  return Response.json(updated);
}
