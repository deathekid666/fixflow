import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { createNotification, getShopAdminIds } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// Called on contracts page load — finds ACTIVE contracts due for billing,
// creates a work order for each, advances nextBillingDate by 1 month,
// and sends an in-app notification to admins.
export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();

  const due = await prisma.contract.findMany({
    where: {
      shopId: user.shopId,
      status: "ACTIVE",
      nextBillingDate: { lte: now },
      // Skip expired contracts
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
  });

  const created: { contractId: string; workOrderId: string }[] = [];

  for (const contract of due) {
    // Generate next billing date (+1 month from current nextBillingDate)
    const nextDate = new Date(contract.nextBillingDate);
    nextDate.setMonth(nextDate.getMonth() + 1);

    // Create work order for this billing cycle
    const orderNumber = `contract-${contract.id.slice(0, 6)}-${Date.now()}`;
    const workOrder = await prisma.workOrder.create({
      data: {
        shopId: contract.shopId,
        orderNumber,
        customerName: contract.customerName,
        customerPhone: contract.customerPhone,
        deviceBrand: contract.deviceBrand,
        deviceModel: contract.deviceModel,
        faultDescription: contract.description ?? "Scheduled maintenance",
        serviceType: "MAINTENANCE",
        faultLevel: "LOW",
        status: "RECEIVED",
        subtotal: contract.monthlyPrice,
        total: contract.monthlyPrice,
        userId: user.id,
      },
    });

    // Advance billing date
    await prisma.contract.update({
      where: { id: contract.id },
      data: { nextBillingDate: nextDate },
    });

    // Notify all shop admins
    const adminIds = await getShopAdminIds(contract.shopId);
    for (const adminId of adminIds) {
      await createNotification(adminId, "CONTRACT_BILLED",
        `Contract billed: ${contract.customerName} — ${contract.deviceBrand} ${contract.deviceModel}`,
        { workOrderId: workOrder.id }
      );
    }

    created.push({ contractId: contract.id, workOrderId: workOrder.id });
  }

  return Response.json({ billed: created.length, orders: created });
}
