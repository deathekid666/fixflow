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
  if (!reason || !scenario) return Response.json({ error: "reason and scenario are required" }, { status: 400 });
  if (!BOUNCE_SCENARIOS.includes(scenario)) return Response.json({ error: "Invalid scenario" }, { status: 400 });

  const bounce = await prisma.bounceRepair.create({
    data: { reason, scenario, workOrderId: params.id },
  });

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

  await prisma.operationLog.create({
    data: {
      action: "BOUNCE",
      description: `Bounce repair: ${scenario} — ${reason}`,
      workOrderId: params.id,
      userId: user.id,
    },
  });

  const shopUsers = await prisma.user.findMany({
    where: { shopId: user.shopId ?? undefined },
  });

  await Promise.all(shopUsers
    .filter(u => u.id !== user.id)
    .map(u =>
      prisma.notification.create({
        data: {
          type: "BOUNCE",
          message: `⚠️ Bounce repair reported — ${order.deviceBrand} ${order.deviceModel} (SN: ${order.serialNumber || "N/A"}) | Customer: ${order.customerName} | Scenario: ${scenario.replace(/_/g, " ")} | Reason: ${reason}`,
          workOrderId: params.id,
          userId: u.id,
        },
      })
    )
  );

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