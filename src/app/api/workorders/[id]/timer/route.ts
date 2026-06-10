import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await req.json();

  const order = await prisma.workOrder.findFirst({
    where: { id: params.id, shopId: user.shopId ?? undefined },
  });
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  if (action === "start") {
    if (order.startedAt) {
      return Response.json({ error: "Timer already started" }, { status: 400 });
    }
    await prisma.workOrder.update({
      where: { id: params.id },
      data: { startedAt: new Date() },
    });
    await prisma.operationLog.create({
      data: {
        action: "TIMER_STARTED",
        description: "Repair timer started",
        workOrderId: params.id,
        userId: user.id,
      },
    });
    return Response.json({ ok: true });
  }

  if (action === "stop") {
    if (!order.startedAt) {
      return Response.json({ error: "Timer has not been started" }, { status: 400 });
    }
    if (order.completedAt) {
      return Response.json({ error: "Timer already stopped" }, { status: 400 });
    }
    const now = new Date();
    const durationMs = now.getTime() - order.startedAt.getTime();
    await prisma.workOrder.update({
      where: { id: params.id },
      data: { completedAt: now },
    });
    await prisma.operationLog.create({
      data: {
        action: "TIMER_STOPPED",
        description: `Repair timer stopped · ${formatDuration(durationMs)}`,
        workOrderId: params.id,
        userId: user.id,
      },
    });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Invalid action. Use start or stop." }, { status: 400 });
}
