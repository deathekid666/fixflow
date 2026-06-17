import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { checkPerm } from "@/lib/permissions";
import type { Prisma } from "@prisma/client";

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
  const noContact = searchParams.get("noContact") === "true";
  const branchId = searchParams.get("branchId");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const canViewAll = user.role !== "ENGINEER" || await checkPerm(user.shopId, "ENGINEER", "VIEW_ALL_ORDERS");

  const where: Prisma.WorkOrderWhereInput = {
    deletedAt: null,
    shopId: user.shopId ?? undefined,
    ...(!canViewAll ? { assignedTo: user.id } : {}),
    ...(branchId ? { branchId } : {}),
    ...(status ? (status.includes(",") ? { status: { in: status.split(",") } } : { status }) : {}),
    ...(noContact ? {
      status: { notIn: ["DELIVERED", "CANCELLED"] },
      updatedAt: { lt: threeDaysAgo },
      OR: [
        { lastReminderAt: null },
        { lastReminderAt: { lt: threeDaysAgo } },
      ],
    } : {}),
    ...(search ? {
      OR: [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
        { deviceModel: { contains: search, mode: "insensitive" } },
        { deviceBrand: { contains: search, mode: "insensitive" } },
        { orderNumber: { contains: search, mode: "insensitive" } },
        { assignee: { name: { contains: search, mode: "insensitive" } } },
      ],
    } : {}),
  };

  const orders = await prisma.workOrder.findMany({
    where,
    include: {
      creator: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
      _count: { select: { parts: true, logs: true } },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  return Response.json(orders);
}

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.shopId) return Response.json({ error: "No shop assigned" }, { status: 400 });

  if (!await checkPerm(user.shopId, user.role, "CREATE_ORDERS")) {
    return Response.json({ error: "Permission denied: CREATE_ORDERS" }, { status: 403 });
  }

  // Check plan limits
  const shop = await prisma.shop.findUnique({
    where: { id: user.shopId },
    select: { plan: true, taxEnabled: true, taxRate: true },
  });

  const plan = (shop?.plan ?? "FREE") as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;

  if (!user.isSuperAdmin && limits.workOrders !== Infinity) {
    const count = await prisma.workOrder.count({ where: { shopId: user.shopId, deletedAt: null } });
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
    serviceType, repairType, faultLevel, branchId: newBranchId,
    referralSource, referredBy,
  } = body;

  if (!deviceBrand || !deviceModel || !customerName || !customerPhone || !faultDescription) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Generate sequential order number per shop per year
  const year = new Date().getFullYear();
  const count = await prisma.workOrder.count({
    where: { shopId: user.shopId },
  });
  const seq = String(count + 1).padStart(4, "0");
  const orderNumber = `wo-${year}-${seq}-${user.shopId.slice(0, 4)}`;

  const shopSettings = await prisma.shopSettings.findUnique({
    where: { shopId: user.shopId },
    select: { defaultSlaHours: true },
  });
  const slaHours = shopSettings?.defaultSlaHours ?? 24;
  const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

  const order = await prisma.workOrder.create({
    data: {
      orderNumber,
      deviceBrand, deviceModel, serialNumber, imei,
      warrantyStart: warrantyStart ? new Date(warrantyStart) : null,
      warrantyEnd: warrantyEnd ? new Date(warrantyEnd) : null,
      isUnderWarranty: isUnderWarranty ?? false,
      customerName, customerPhone, customerEmail,
      faultDescription, appearance, remarks,
      serviceType: serviceType ?? "IN_STORE",
      repairType,
      faultLevel: faultLevel ?? "LOW",
      referralSource: referralSource || null,
      referredBy: referredBy || null,
      status: "RECEIVED",
      shopId: user.shopId,
      userId: user.id,
      branchId: newBranchId || null,
      slaDeadline,
      taxRate: shop?.taxEnabled ? (shop.taxRate ?? 0) : 0,
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