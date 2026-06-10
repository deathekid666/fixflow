import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import bcrypt from "bcrypt";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body?.name?.trim()) return Response.json({ error: "Name required" }, { status: 400 });

  const target = await prisma.user.findFirst({
    where: { id: params.id, shopId: user.shopId ?? undefined },
  });
  if (!target) return Response.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {
    name: body.name.trim(),
    email: body.email?.trim() || target.email,
  };

  if (body.password?.trim()) {
    data.password = await bcrypt.hash(body.password.trim(), 10);
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, email: true, role: true },
  });

  return Response.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  if (user.id === params.id) return Response.json({ error: "Cannot delete yourself" }, { status: 400 });

  const target = await prisma.user.findFirst({
    where: { id: params.id, shopId: user.shopId ?? undefined },
  });
  if (!target) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.user.delete({ where: { id: params.id } });
  return Response.json({ ok: true });
}
