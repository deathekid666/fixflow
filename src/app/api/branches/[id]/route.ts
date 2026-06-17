import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Admins only" }, { status: 403 });

  const branch = await prisma.branch.findFirst({
    where: { id: params.id, shopId: user.shopId },
  });
  if (!branch) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name, address, phone, managerId, isActive } = body;

  const updated = await prisma.branch.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(address !== undefined ? { address: address || null } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
      ...(managerId !== undefined ? { managerId: managerId || null } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
    include: {
      manager: { select: { id: true, name: true } },
      _count: { select: { users: true, workOrders: true, spareParts: true } },
    },
  });

  return Response.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN" && !user.isSuperAdmin) return Response.json({ error: "Admins only" }, { status: 403 });

  const branch = await prisma.branch.findFirst({
    where: { id: params.id, shopId: user.shopId },
  });
  if (!branch) return Response.json({ error: "Not found" }, { status: 404 });

  // Unassign users and work orders before deleting
  await prisma.user.updateMany({ where: { branchId: params.id }, data: { branchId: null } });
  await prisma.workOrder.updateMany({ where: { branchId: params.id }, data: { branchId: null } });
  await prisma.sparePart.updateMany({ where: { branchId: params.id }, data: { branchId: null } });

  await prisma.branch.delete({ where: { id: params.id } });
  return Response.json({ ok: true });
}
