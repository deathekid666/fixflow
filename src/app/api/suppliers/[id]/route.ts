import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.name?.trim()) return Response.json({ error: "Name required" }, { status: 400 });

  const supplier = await prisma.supplier.findFirst({
    where: { id: params.id, shopId: user.shopId },
  });
  if (!supplier) return Response.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.supplier.update({
    where: { id: params.id },
    data: {
      name: body.name.trim(),
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      address: body.address?.trim() || null,
      notes: body.notes?.trim() || null,
    },
    include: { _count: { select: { purchaseOrders: true } } },
  });

  return Response.json(updated);
}
