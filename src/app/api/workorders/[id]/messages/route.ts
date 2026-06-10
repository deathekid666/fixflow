import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const messages = await prisma.customerMessage.findMany({
    where: { workOrderId: params.id },
    orderBy: { createdAt: "asc" },
  });
  return Response.json(messages);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);

  const body = await req.json().catch(() => null);
  if (!body?.message?.trim()) {
    return Response.json({ error: "Message required" }, { status: 400 });
  }

  const order = await prisma.workOrder.findFirst({
    where: { id: params.id },
    select: { id: true, shopId: true },
  });
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  if (user && user.shopId !== order.shopId) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const msg = await prisma.customerMessage.create({
    data: {
      message: body.message.trim(),
      senderType: user ? "SHOP" : "CUSTOMER",
      workOrderId: params.id,
    },
  });

  return Response.json(msg, { status: 201 });
}
