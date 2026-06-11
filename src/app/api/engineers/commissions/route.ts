import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7); // "2026-06"

  const [year, mon] = month.split("-").map(Number);
  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 1);

  const shopFilter = user.shopId ? { shopId: user.shopId } : {};

  const engineers = await prisma.user.findMany({
    where: { ...(user.shopId ? { shopId: user.shopId } : {}), role: { in: ["ENGINEER", "ADMIN"] } },
    select: { id: true, name: true, email: true, role: true, commissionRate: true },
    orderBy: { name: "asc" },
  });

  const results = await Promise.all(engineers.map(async (eng) => {
    const orders = await prisma.workOrder.findMany({
      where: {
        ...shopFilter,
        assignedTo: eng.id,
        status: { in: ["DONE", "DELIVERED"] },
        updatedAt: { gte: start, lt: end },
      },
      select: { total: true, collected: true },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const commissionAmount = (totalRevenue * eng.commissionRate) / 100;

    // Check if a locked snapshot exists
    const locked = await prisma.engineerCommission.findUnique({
      where: { userId_shopId_month: { userId: eng.id, shopId: user.shopId!, month } },
    });

    return {
      userId: eng.id,
      name: eng.name,
      email: eng.email,
      role: eng.role,
      commissionRate: eng.commissionRate,
      totalOrders,
      totalRevenue,
      commissionAmount,
      locked: locked ? { totalOrders: locked.totalOrders, totalRevenue: locked.totalRevenue, commissionRate: locked.commissionRate, commissionAmount: locked.commissionAmount } : null,
    };
  }));

  return Response.json(results);
}

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user || user.role !== "ADMIN" || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { month, rows } = body as {
    month: string;
    rows: { userId: string; totalOrders: number; totalRevenue: number; commissionRate: number; commissionAmount: number }[];
  };

  if (!month || !Array.isArray(rows)) return Response.json({ error: "Invalid body" }, { status: 400 });

  await Promise.all(rows.map(r =>
    prisma.engineerCommission.upsert({
      where: { userId_shopId_month: { userId: r.userId, shopId: user.shopId!, month } },
      update: { totalOrders: r.totalOrders, totalRevenue: r.totalRevenue, commissionRate: r.commissionRate, commissionAmount: r.commissionAmount },
      create: { userId: r.userId, shopId: user.shopId!, month, totalOrders: r.totalOrders, totalRevenue: r.totalRevenue, commissionRate: r.commissionRate, commissionAmount: r.commissionAmount },
    })
  ));

  return Response.json({ ok: true });
}
