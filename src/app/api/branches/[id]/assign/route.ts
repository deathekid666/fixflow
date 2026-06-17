import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

// POST { userId, branchId: null|id } — assign or unassign engineer from branch
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Admins only" }, { status: 403 });

  const body = await req.json();
  const { userId, remove } = body;

  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

  // Verify user belongs to this shop
  const target = await prisma.user.findFirst({ where: { id: userId, shopId: user.shopId } });
  if (!target) return Response.json({ error: "User not found" }, { status: 404 });

  // Verify branch belongs to this shop
  const branch = await prisma.branch.findFirst({ where: { id: params.id, shopId: user.shopId } });
  if (!branch) return Response.json({ error: "Branch not found" }, { status: 404 });

  await prisma.user.update({
    where: { id: userId },
    data: { branchId: remove ? null : params.id },
  });

  return Response.json({ ok: true });
}
