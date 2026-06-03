import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { name, address, phone, email } = await req.json();

  const shop = await prisma.shop.update({
    where: { id: params.id },
    data: {
      ...(name && { name }),
      address: address || null,
      phone: phone || null,
      email: email || null,
    },
  });

  return Response.json(shop);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.isSuperAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  await prisma.shop.delete({ where: { id: params.id } });
  return Response.json({ message: "Deleted" });
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findFirst({
    where: { id: params.id },
  });

  if (!shop) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(shop);
}