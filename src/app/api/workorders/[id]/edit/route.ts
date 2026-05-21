// src/app/api/workorders/[id]/edit/route.ts
// Admin: full edit. Engineers: limited fields only.
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.workOrder.findUnique({ where: { id: params.id } });
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  // Shop scope for non-admins
  if (user.role !== "ADMIN" && order.shopId !== user.shopId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  // Fields any authenticated user can update
  const sharedFields: Record<string, unknown> = {};
  const allowed = [
    "faultDescription", "appearance", "remarks", "repairType",
    "faultLevel", "assignedTo", "serviceType",
    "subtotal", "quotationItems", "discount", "total", "collected", "quotationRemarks",
    "warrantyStart", "warrantyEnd", "isUnderWarranty",
  ];
  for (const key of allowed) {
    if (body[key] !== undefined) sharedFields[key] = body[key];
  }

  // Admin-only fields
  if (user.role === "ADMIN") {
    const adminOnly = [
      "deviceBrand", "deviceModel", "serialNumber", "imei",
      "customerName", "customerPhone", "customerEmail",
      "shopId", "userId",
    ];
    for (const key of adminOnly) {
      if (body[key] !== undefined) sharedFields[key] = body[key];
    }
  }

  // Parse date fields
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

// DELETE — admin only
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

  await prisma.workOrder.delete({ where: { id: params.id } });

  return Response.json({ message: "Work order deleted" });
}
