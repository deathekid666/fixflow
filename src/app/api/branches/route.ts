import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const branches = await prisma.branch.findMany({
    where: { shopId: user.shopId },
    include: {
      manager: { select: { id: true, name: true } },
      _count: { select: { users: true, workOrders: true, spareParts: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(branches);
}

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Admins only" }, { status: 403 });

  const body = await req.json();
  const { name, address, phone, managerId } = body;

  if (!name) return Response.json({ error: "Name is required" }, { status: 400 });

  const branch = await prisma.branch.create({
    data: {
      shopId: user.shopId,
      name,
      address: address || null,
      phone: phone || null,
      managerId: managerId || null,
    },
    include: {
      manager: { select: { id: true, name: true } },
      _count: { select: { users: true, workOrders: true, spareParts: true } },
    },
  });

  return Response.json(branch, { status: 201 });
}
