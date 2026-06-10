import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.amount) return Response.json({ error: "title and amount required" }, { status: 400 });

  const expense = await prisma.expense.findFirst({
    where: { id: params.id, shopId: user.shopId ?? undefined },
  });
  if (!expense) return Response.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.expense.update({
    where: { id: params.id },
    data: {
      title: body.title.trim(),
      amount: parseFloat(body.amount),
      category: body.category || "OTHER",
      note: body.note?.trim() || null,
      date: body.date ? new Date(body.date) : expense.date,
    },
    include: { user: { select: { name: true } } },
  });

  return Response.json(updated);
}
