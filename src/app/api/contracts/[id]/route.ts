import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const contract = await prisma.contract.findFirst({
    where: { id: params.id, shopId: user.shopId },
  });
  if (!contract) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { status, monthlyPrice, endDate, notes, nextBillingDate, description } = body;

  const updated = await prisma.contract.update({
    where: { id: params.id },
    data: {
      ...(status !== undefined && { status }),
      ...(monthlyPrice !== undefined && { monthlyPrice: parseFloat(monthlyPrice) || 0 }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(nextBillingDate !== undefined && { nextBillingDate: new Date(nextBillingDate) }),
      ...(description !== undefined && { description: description || null }),
    },
  });

  return Response.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || !user.shopId || user.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contract = await prisma.contract.findFirst({
    where: { id: params.id, shopId: user.shopId },
  });
  if (!contract) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.contract.delete({ where: { id: params.id } });
  return Response.json({ ok: true });
}
