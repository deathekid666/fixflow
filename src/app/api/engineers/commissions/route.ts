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

  const engineerIds = engineers.map((e) => e.id);

  // Batch: fetch all qualifying orders for all engineers in one query
  const allOrders = await prisma.workOrder.findMany({
    where: {
      ...shopFilter,
      assignedTo: { in: engineerIds },
      status: { in: ["DONE", "DELIVERED"] },
      updatedAt: { gte: start, lt: end },
    },
    select: { assignedTo: true, total: true, collected: true },
  });

  const ordersByEngineer = new Map<string, { total: number; collected: number }[]>();
  for (const o of allOrders) {
    if (!o.assignedTo) continue;
    const arr = ordersByEngineer.get(o.assignedTo) ?? [];
    arr.push({ total: o.total, collected: o.collected });
    ordersByEngineer.set(o.assignedTo, arr);
  }

  // Batch: fetch all locked snapshots in one query
  const lockedRows = await prisma.engineerCommission.findMany({
    where: { shopId: user.shopId!, month, userId: { in: engineerIds } },
  });
  const lockedByEngineer = new Map(lockedRows.map((l) => [l.userId, l]));

  const results = engineers.map((eng) => {
    const orders = ordersByEngineer.get(eng.id) ?? [];
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const commissionAmount = (totalRevenue * eng.commissionRate) / 100;

    const locked = lockedByEngineer.get(eng.id);

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
  });

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
