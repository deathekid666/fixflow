import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  if (!phone) return Response.json({ error: "phone required" }, { status: 400 });

  const notes = await prisma.customerNote.findMany({
    where: { phone, shopId: user.shopId ?? undefined },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(notes);
}

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.shopId) return Response.json({ error: "No shop" }, { status: 400 });

  const { phone, message } = await req.json();
  if (!phone || !message?.trim()) return Response.json({ error: "phone and message required" }, { status: 400 });

  const note = await prisma.customerNote.create({
    data: { phone, message: message.trim(), shopId: user.shopId, userId: user.id },
    include: { user: { select: { name: true } } },
  });

  return Response.json(note, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const note = await prisma.customerNote.findUnique({ where: { id } });
  if (!note || note.shopId !== user.shopId) return Response.json({ error: "Not found" }, { status: 404 });
  if (note.userId !== user.id && user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  await prisma.customerNote.delete({ where: { id } });
  return Response.json({ success: true });
}
