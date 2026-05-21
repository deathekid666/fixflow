// src/app/api/ratings/route.ts
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

// GET /api/ratings?workOrderId=xxx
export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workOrderId = searchParams.get("workOrderId");

  const ratings = await prisma.satisfactionRating.findMany({
    where: {
      ...(workOrderId ? { workOrderId } : {}),
      // Scope to shop via workOrder
      workOrder: {
        shopId: user.role !== "ADMIN" ? (user.shopId ?? undefined) : undefined,
      },
    },
    include: {
      workOrder: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerPhone: true,
          deviceModel: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(ratings);
}

// POST /api/ratings
export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { workOrderId, rating, comment } = await req.json();

  if (!workOrderId || rating === undefined) {
    return Response.json(
      { error: "workOrderId and rating are required" },
      { status: 400 }
    );
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return Response.json(
      { error: "rating must be an integer between 1 and 5" },
      { status: 400 }
    );
  }

  const order = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
  });

  if (!order) return Response.json({ error: "Work order not found" }, { status: 404 });

  if (order.status !== "DELIVERED") {
    return Response.json(
      { error: "Ratings can only be submitted for delivered work orders" },
      { status: 400 }
    );
  }

  const existing = await prisma.satisfactionRating.findUnique({
    where: { workOrderId },
  });
  if (existing) {
    return Response.json(
      { error: "A rating already exists for this work order" },
      { status: 409 }
    );
  }

  const created = await prisma.satisfactionRating.create({
    data: { workOrderId, rating, comment },
    include: {
      workOrder: {
        select: { orderNumber: true, customerName: true, deviceModel: true },
      },
    },
  });

  return Response.json(created, { status: 201 });
}
