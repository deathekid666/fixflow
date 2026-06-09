import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const expenses = await prisma.expense.findMany({
    where: {
      shopId: user.shopId ?? undefined,
      ...(category ? { category } : {}),
    },
    include: { user: { select: { name: true } } },
    orderBy: { date: "desc" },
  });

  return Response.json(expenses);
}

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!user.shopId) return Response.json({ error: "No shop" }, { status: 400 });

  const { title, amount, category, note, date } = await req.json();
  if (!title || !amount) return Response.json({ error: "title and amount required" }, { status: 400 });

  const expense = await prisma.expense.create({
    data: {
      title,
      amount: parseFloat(amount),
      category: category || "OTHER",
      note: note || null,
      date: date ? new Date(date) : new Date(),
      shopId: user.shopId,
      userId: user.id,
    },
    include: { user: { select: { name: true } } },
  });

  return Response.json(expense, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  await prisma.expense.delete({ where: { id } });
  return Response.json({ success: true });
}