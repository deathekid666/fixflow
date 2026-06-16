import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const part = await prisma.sparePart.findFirst({
    where: { id: params.id, shopId: user.shopId ?? undefined },
  });
  if (!part) return Response.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.sparePart.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.partNumber !== undefined && { partNumber: body.partNumber }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.unitPrice !== undefined && { unitPrice: Number(body.unitPrice) }),
      ...(body.stock !== undefined && { stock: Number(body.stock) }),
    },
  });

  if (updated.stock <= 5) {
    await createNotification(user.id, "LOW_STOCK", `Low stock: ${updated.name} (${updated.stock} left)`, {
      link: "/dashboard/spareparts",
    });
  }

  return Response.json(updated);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const part = await prisma.sparePart.findFirst({
    where: { id: params.id, shopId: user.shopId ?? undefined },
  });
  if (!part) return Response.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.sparePart.update({
    where: { id: params.id },
    data: {
      name: body.name ?? part.name,
      partNumber: body.partNumber ?? part.partNumber,
      description: body.description ?? part.description,
      unitPrice: body.unitPrice !== undefined ? Number(body.unitPrice) : part.unitPrice,
      stock: body.stock !== undefined ? Number(body.stock) : part.stock,
    },
  });

  if (updated.stock <= 5) {
    await createNotification(user.id, "LOW_STOCK", `Low stock: ${updated.name} (${updated.stock} left)`, {
      link: "/dashboard/spareparts",
    });
  }

  return Response.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const part = await prisma.sparePart.findFirst({
    where: { id: params.id, shopId: user.shopId ?? undefined },
  });
  if (!part) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.sparePart.delete({ where: { id: params.id } });
  return Response.json({ success: true });
}