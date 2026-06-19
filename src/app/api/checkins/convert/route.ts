import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { walkInId, deviceBrand, deviceModel, faultDescription } = await req.json().catch(() => ({}));
  if (!walkInId) return Response.json({ error: "Missing walkInId" }, { status: 400 });

  const walkIn = await prisma.walkIn.findFirst({
    where: { id: walkInId, shopId: user.shopId },
  });
  if (!walkIn) return Response.json({ error: "Walk-in not found" }, { status: 404 });
  if (walkIn.workOrderId) return Response.json({ error: "Already converted", workOrderId: walkIn.workOrderId }, { status: 409 });

  const year = new Date().getFullYear();
  const count = await prisma.workOrder.count({ where: { shopId: user.shopId } });
  const orderNumber = `wo-${year}-${String(count + 1).padStart(4, "0")}-${user.shopId.slice(0, 4)}`;

  const shopSettings = await prisma.shopSettings.findUnique({
    where: { shopId: user.shopId },
    select: { defaultSlaHours: true },
  });
  const slaDeadline = new Date(Date.now() + (shopSettings?.defaultSlaHours ?? 24) * 3600000);

  const workOrder = await prisma.workOrder.create({
    data: {
      orderNumber,
      shopId: user.shopId,
      userId: user.id,
      customerName: walkIn.customerName,
      customerPhone: walkIn.customerPhone,
      deviceBrand: deviceBrand?.trim() || "Unknown",
      deviceModel: deviceModel?.trim() || "Unknown",
      faultDescription: faultDescription?.trim() || "Walk-in repair",
      serviceType: "IN_STORE",
      faultLevel: "LOW",
      status: "RECEIVED",
      slaDeadline,
    },
  });

  await Promise.all([
    prisma.walkIn.update({ where: { id: walkInId }, data: { workOrderId: workOrder.id } }),
    prisma.operationLog.create({
      data: { action: "CREATED", description: "Created from walk-in check-in", workOrderId: workOrder.id, userId: user.id },
    }),
  ]);

  return Response.json({ workOrderId: workOrder.id });
}
