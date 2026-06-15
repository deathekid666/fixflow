// src/app/api/workorders/[id]/edit/route.ts
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

// Fields any authorized user (admin or owning engineer) may edit
const EDITABLE_FIELDS = [
  "faultDescription", "appearance", "remarks", "repairType",
  "faultLevel", "assignedTo", "serviceType",
  "subtotal", "quotationItems", "discount", "total", "collected", "quotationRemarks",
  "warrantyStart", "warrantyEnd", "isUnderWarranty",
] as const;

// Additional fields only an admin may edit
const ADMIN_ONLY_FIELDS = [
  "deviceBrand", "deviceModel", "serialNumber", "imei",
  "customerName", "customerPhone", "customerEmail",
  "shopId", "userId",
] as const;

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.workOrder.findUnique({ where: { id: params.id } });
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  if (user.role !== "ADMIN" && order.shopId !== user.shopId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const sharedFields: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (body[key] !== undefined) sharedFields[key] = body[key];
  }

  if (user.role === "ADMIN") {
    for (const key of ADMIN_ONLY_FIELDS) {
      if (body[key] !== undefined) sharedFields[key] = body[key];
    }
  }

  if (sharedFields.warrantyStart)
    sharedFields.warrantyStart = new Date(sharedFields.warrantyStart as string);
  if (sharedFields.warrantyEnd)
    sharedFields.warrantyEnd = new Date(sharedFields.warrantyEnd as string);

  const updated = await prisma.workOrder.update({
    where: { id: params.id },
    data: sharedFields,
  });

  await prisma.operationLog.create({
    data: {
      action: "EDITED",
      description: `Work order edited by ${user.role === "ADMIN" ? "admin" : "engineer"}`,
      workOrderId: order.id,
      userId: user.id,
    },
  });

  return Response.json(updated);
}

// DELETE — admin only, soft delete (sets deletedAt). Related records are kept
// so the order can be restored or audited; list queries filter deletedAt: null.
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") {
    return Response.json({ error: "Only admins can delete work orders" }, { status: 403 });
  }

  const order = await prisma.workOrder.findUnique({ where: { id: params.id } });
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.workOrder.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  await prisma.operationLog.create({
    data: {
      action: "DELETED",
      description: "Work order deleted (soft delete)",
      workOrderId: order.id,
      userId: user.id,
    },
  });

  return Response.json({ message: "Work order deleted" });
}
