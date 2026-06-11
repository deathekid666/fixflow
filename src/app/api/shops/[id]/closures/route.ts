import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.shopId !== params.id && !user.isSuperAdmin)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const closures = await prisma.shopClosure.findMany({
    where: { shopId: params.id },
    orderBy: { date: "asc" },
  });
  return Response.json(closures);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  if (user.shopId !== params.id && !user.isSuperAdmin)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const { date, reason } = body ?? {};
  if (!date) return Response.json({ error: "date required" }, { status: 400 });

  const closure = await prisma.shopClosure.create({
    data: {
      shopId: params.id,
      date: new Date(date),
      reason: reason?.trim() || null,
    },
  });
  return Response.json(closure, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const closureId = searchParams.get("closureId");
  if (!closureId) return Response.json({ error: "closureId required" }, { status: 400 });

  const closure = await prisma.shopClosure.findFirst({
    where: { id: closureId, shopId: params.id },
  });
  if (!closure) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.shopClosure.delete({ where: { id: closureId } });
  return Response.json({ ok: true });
}
