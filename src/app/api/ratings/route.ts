import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { createNotification, getShopAdminIds } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workOrderId = searchParams.get("workOrderId");

  const ratings = await prisma.satisfactionRating.findMany({
    where: {
      ...(workOrderId ? { workOrderId } : {}),
      workOrder: {
        shopId: user.role !== "ADMIN" ? (user.shopId ?? undefined) : undefined,
      },
    },
    include: {
      workOrder: {
        select: { id: true, orderNumber: true, customerName: true, customerPhone: true, deviceModel: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(ratings);
}

export async function POST(req: Request) {
  const { workOrderId, orderNumber, rating, comment } = await req.json();

  if ((!workOrderId && !orderNumber) || rating === undefined) {
    return Response.json({ error: "workOrderId or orderNumber and rating are required" }, { status: 400 });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return Response.json({ error: "rating must be between 1 and 5" }, { status: 400 });
  }

  // Find order by either workOrderId or orderNumber (for public portal)
  const order = await prisma.workOrder.findFirst({
    where: workOrderId ? { id: workOrderId } : { orderNumber: { startsWith: orderNumber.toLowerCase() } },
  });

  if (!order) return Response.json({ error: "Work order not found" }, { status: 404 });

  if (order.status !== "DELIVERED") {
    return Response.json({ error: "Ratings can only be submitted for delivered orders" }, { status: 400 });
  }

  const existing = await prisma.satisfactionRating.findUnique({ where: { workOrderId: order.id } });
  if (existing) return Response.json({ error: "Already rated" }, { status: 409 });

  const created = await prisma.satisfactionRating.create({
    data: { workOrderId: order.id, rating, comment: comment || null },
    include: {
      workOrder: { select: { orderNumber: true, customerName: true, deviceModel: true } },
    },
  });

  // Notify shop admins of new rating
  const adminIds = await getShopAdminIds(order.shopId);
  const stars = "⭐".repeat(rating);
  await Promise.all(
    adminIds.map((uid) =>
      createNotification(uid, "NEW_RATING", `${stars} rated by ${created.workOrder.customerName} for ${created.workOrder.deviceModel}`, {
        workOrderId: order.id,
        link: `/dashboard/workorders/${order.id}`,
      })
    )
  );

  return Response.json(created, { status: 201 });
}