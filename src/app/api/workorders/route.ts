import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

const PLAN_LIMITS = {
  FREE: { workOrders: 50, engineers: 2, spareParts: 50 },
  PRO: { workOrders: Infinity, engineers: Infinity, spareParts: Infinity },
  ENTERPRISE: { workOrders: Infinity, engineers: Infinity, spareParts: Infinity },
};

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const orders = await prisma.workOrder.findMany({
    where: {
      shopId: user.shopId ?? undefined,
      ...(status ? { status } : {}),
      ...(search ? {
        OR: [
          { customerName: { contains: search, mode: "insensitive" } },
          { customerPhone: { contains: search, mode: "insensitive" } },
          { deviceModel: { contains: search, mode: "insensitive" } },
          { orderNumber: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    include: {
      creator: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
      _count: { select: { parts: true, logs: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(orders);
}

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.shopId) return Response.json({ error: "No shop assigned" }, { status: 400 });

  // Check plan limits
  const shop = await prisma.shop.findUnique({
    where: { id: user.shopId },
    select: { plan: true },
  });

  const plan = (shop?.plan ?? "FREE") as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;

  if (limits.workOrders !== Infinity) {
    const count = await prisma.workOrder.count({ where: { shopId: user.shopId } });
    if (count >= limits.workOrders) {
      return Response.json({
        error: `You've reached the ${plan} plan limit of ${limits.workOrders} work orders. Upgrade to PRO for unlimited orders.`,
        limitReached: true,
        limit: limits.workOrders,
        current: count,
      }, { status: 403 });
    }
  }

  const body = await req.json();
  const {
    deviceBrand, deviceModel, serialNumber, imei,
    warrantyStart, warrantyEnd, isUnderWarranty,
    customerName, customerPhone, customerEmail,
    faultDescription, appearance, remarks,
    serviceType, repairType, faultLevel,
  } = body;

  if (!deviceBrand || !deviceModel || !customerName || !customerPhone || !faultDescription) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const order = await prisma.workOrder.create({
    data: {
      deviceBrand, deviceModel, serialNumber, imei,
      warrantyStart: warrantyStart ? new Date(warrantyStart) : null,
      warrantyEnd: warrantyEnd ? new Date(warrantyEnd) : null,
      isUnderWarranty: isUnderWarranty ?? false,
      customerName, customerPhone, customerEmail,
      faultDescription, appearance, remarks,
      serviceType: serviceType ?? "IN_STORE",
      repairType,
      faultLevel: faultLevel ?? "LOW",
      status: "RECEIVED",
      shopId: user.shopId,
      userId: user.id,
    },
  });

  await prisma.operationLog.create({
    data: {
      action: "CREATED",
      description: "Work order created",
      workOrderId: order.id,
      userId: user.id,
    },
  });

  return Response.json(order, { status: 201 });
}