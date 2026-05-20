import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.workOrder.findFirst({
    where: { id: params.id, shopId: user.shopId ?? undefined },
  });
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  const allowed = [
    "deviceBrand", "deviceModel", "serialNumber", "imei",
    "warrantyStart", "warrantyEnd", "isUnderWarranty",
    "customerName", "customerPhone", "customerEmail",
    "faultDescription", "appearance", "remarks",
    "serviceType", "repairType", "faultLevel",
  ];

  const data: Record<string, any> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  if (data.warrantyStart) data.warrantyStart = new Date(data.warrantyStart);
  if (data.warrantyEnd) data.warrantyEnd = new Date(data.warrantyEnd);

  const updated = await prisma.workOrder.update({
    where: { id: params.id },
    data: { ...data, updatedAt: new Date() },
  });

  await prisma.operationLog.create({
    data: {
      action: "EDITED",
      description: "Work order details edited",
      workOrderId: params.id,
      userId: user.id,
    },
  });

  return Response.json(updated);
}