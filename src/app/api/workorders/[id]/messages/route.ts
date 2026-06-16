import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { createNotification, getShopAdminIds } from "@/lib/notifications";
import { pushToUser } from "@/lib/pushNotify";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);

  const order = await prisma.workOrder.findFirst({
    where: { id: params.id },
    select: { id: true, shopId: true },
  });
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  // Authenticated shop users may only access work orders in their own shop
  if (user && user.shopId !== order.shopId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (user) {
    // Shop is reading — mark all CUSTOMER messages as read
    await prisma.customerMessage.updateMany({
      where: { workOrderId: params.id, senderType: "CUSTOMER", read: false },
      data: { read: true },
    });
  } else {
    // Customer is reading — mark all SHOP messages as read
    await prisma.customerMessage.updateMany({
      where: { workOrderId: params.id, senderType: "SHOP", read: false },
      data: { read: true },
    });
  }

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

  const senderType = user ? "SHOP" : "CUSTOMER";
  const msg = await prisma.customerMessage.create({
    data: { message: body.message.trim(), senderType, workOrderId: params.id },
  });

  // Notify shop admins when a customer sends a message (in-app + push)
  if (senderType === "CUSTOMER" && order.shopId) {
    const adminIds = await getShopAdminIds(order.shopId);
    const shortId = params.id.slice(0, 8).toUpperCase();
    await Promise.all(
      adminIds.map(async (uid) => {
        await createNotification(uid, "NEW_MESSAGE", `Customer message on order ${shortId}`, {
          workOrderId: params.id,
          link: `/dashboard/workorders/${params.id}`,
        });
        await pushToUser(uid, {
          title: "💬 New Customer Message",
          body: body.message.trim().slice(0, 100),
          url: `/dashboard/workorders/${params.id}`,
          tag: `msg-${params.id}`,
        });
      })
    );
  }

  return Response.json(msg, { status: 201 });
}
