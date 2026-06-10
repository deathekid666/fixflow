import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.purchaseOrder.findFirst({
    where: { id: params.id, shopId: user.shopId },
    include: {
      supplier: true,
      items: { include: { sparePart: true } },
      creator: { select: { name: true } },
    },
  });

  if (!order) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(order);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Body required" }, { status: 400 });

  const order = await prisma.purchaseOrder.findFirst({
    where: { id: params.id, shopId: user.shopId },
  });
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.purchaseOrder.update({
    where: { id: params.id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });

  return Response.json(updated);
}
