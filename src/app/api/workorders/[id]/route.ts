import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.workOrder.findFirst({
    where: { id: params.id, shopId: user.shopId ?? undefined },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      parts: {
        include: {
          sparePart: { select: { id: true, name: true, partNumber: true } },
        },
      },
      logs: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      attachments: true,
    },
  });

  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json(order);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.workOrder.findFirst({
    where: { id: params.id, shopId: user.shopId ?? undefined },
  });

  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  const updated = await prisma.workOrder.update({
    where: { id: params.id },
    data: {
      ...body,
      warrantyStart: body.warrantyStart ? new Date(body.warrantyStart) : undefined,
      warrantyEnd: body.warrantyEnd ? new Date(body.warrantyEnd) : undefined,
      updatedAt: new Date(),
    },
  });

  await prisma.operationLog.create({
    data: {
      action: "UPDATED",
      description: "Work order updated",
      workOrderId: params.id,
      userId: user.id,
    },
  });

  return Response.json(updated);
}
