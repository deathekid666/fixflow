import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const notes = await prisma.internalNote.findMany({
    where: { workOrderId: params.id },
    include: { user: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(notes);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.workOrder.findFirst({
    where: { id: params.id, shopId: user.shopId ?? undefined },
  });
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });

  const { message } = await req.json();
  if (!message || message.trim().length === 0) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  const note = await prisma.internalNote.create({
    data: { message: message.trim(), workOrderId: params.id, userId: user.id },
    include: { user: { select: { id: true, name: true, role: true } } },
  });

  return Response.json(note, { status: 201 });
}
