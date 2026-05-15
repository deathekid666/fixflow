import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

const BOUNCE_SCENARIOS = [
  "SAME_FAULT_RETURNED",
  "NEW_FAULT_AFTER_REPAIR",
  "PART_FAILURE",
  "CUSTOMER_MISUSE",
  "INCOMPLETE_REPAIR",
  "OTHER",
];

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.workOrder.findFirst({
    where: { id: params.id, shopId: user.shopId ?? undefined },
  });

  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  const { reason, scenario } = await req.json();

  if (!reason || !scenario) {
    return Response.json({ error: "reason and scenario are required" }, { status: 400 });
  }

  if (!BOUNCE_SCENARIOS.includes(scenario)) {
    return Response.json({ error: "Invalid scenario" }, { status: 400 });
  }

  // Create bounce record
  const bounce = await prisma.bounceRepair.create({
    data: { reason, scenario, workOrderId: params.id },
  });

  // Update work order
  await prisma.workOrder.update({
    where: { id: params.id },
    data: {
      bounceCount: { increment: 1 },
      isBounce: true,
      status: "RECEIVED",
      receivedAt: new Date(),
      doneAt: null,
      deliveredAt: null,
    },
  });

  // Log it
  await prisma.operationLog.create({
    data: {
      action: "BOUNCE",
      description: `Bounce repair: ${scenario} — ${reason}`,
      workOrderId: params.id,
      userId: user.id,
    },
  });

  // Notify all admins in the shop
  const admins = await prisma.user.findMany({
    where: { shopId: user.shopId ?? undefined, role: "ADMIN" },
  });

  await Promise.all(admins.map(admin =>
    prisma.notification.create({
      data: {
        type: "BOUNCE",
        message: `⚠️ Bounce repair on ${order.deviceBrand} ${order.deviceModel} (SN: ${order.serialNumber || "N/A"}) — ${scenario.replace(/_/g, " ")}`,
        workOrderId: params.id,
        userId: admin.id,
      },
    })
  ));

  return Response.json(bounce, { status: 201 });
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const bounces = await prisma.bounceRepair.findMany({
    where: { workOrderId: params.id },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(bounces);
}
