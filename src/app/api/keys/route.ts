import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const keys = await prisma.apiKey.findMany({
    where: { shopId: user.shopId ?? undefined },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, key: true, lastUsed: true, createdAt: true, isActive: true },
  });

  return Response.json(keys);
}

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!user.shopId) return Response.json({ error: "No shop" }, { status: 400 });

  const { name } = await req.json();
  if (!name?.trim()) return Response.json({ error: "Name is required" }, { status: 400 });

  const key = `fk_${randomUUID().replace(/-/g, "")}`;

  const apiKey = await prisma.apiKey.create({
    data: { name: name.trim(), key, shopId: user.shopId },
    select: { id: true, name: true, key: true, lastUsed: true, createdAt: true, isActive: true },
  });

  return Response.json(apiKey, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  await prisma.apiKey.deleteMany({
    where: { id, shopId: user.shopId ?? undefined },
  });

  return Response.json({ ok: true });
}
