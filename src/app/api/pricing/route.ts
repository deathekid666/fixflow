import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

// GET /api/pricing — returns pricing stats grouped by repairType
export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });

  const shopId = user.shopId!;

  const prices = await prisma.repairPrice.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
  });

  // Group by repairType
  const grouped: Record<string, {
    repairType: string;
    count: number;
    prices: number[];
    partsCosts: number[];
    acceptedCount: number;
    entries: typeof prices;
  }> = {};

  for (const p of prices) {
    const key = p.repairType;
    if (!grouped[key]) {
      grouped[key] = { repairType: key, count: 0, prices: [], partsCosts: [], acceptedCount: 0, entries: [] };
    }
    grouped[key].count++;
    grouped[key].prices.push(p.price);
    grouped[key].partsCosts.push(p.partsCost);
    if (p.acceptedByCustomer) grouped[key].acceptedCount++;
    grouped[key].entries.push(p);
  }

  const stats = Object.values(grouped).map(g => {
    const sorted = [...g.prices].sort((a, b) => a - b);
    const avg = g.prices.reduce((s, v) => s + v, 0) / g.prices.length;
    const avgPartsCost = g.partsCosts.reduce((s, v) => s + v, 0) / g.partsCosts.length;
    const avgMargin = avgPartsCost > 0 ? Math.round(((avg - avgPartsCost) / avg) * 100) : null;
    const acceptanceRate = Math.round((g.acceptedCount / g.count) * 100);

    // Trend: last 5 prices in order
    const recent = g.entries.slice(0, 5).reverse().map(e => ({
      price: e.price,
      date: e.createdAt,
    }));

    return {
      repairType: g.repairType,
      count: g.count,
      minPrice: sorted[0],
      maxPrice: sorted[sorted.length - 1],
      avgPrice: Math.round(avg),
      avgPartsCost: Math.round(avgPartsCost),
      avgMargin,
      acceptanceRate,
      recent,
    };
  }).sort((a, b) => b.count - a.count);

  // Analytics
  const underpriced = stats.filter(s => s.avgMargin !== null && s.avgMargin < 20);
  const mostProfitable = [...stats].filter(s => s.avgMargin !== null).sort((a, b) => (b.avgMargin ?? 0) - (a.avgMargin ?? 0)).slice(0, 3);
  const leastProfitable = [...stats].filter(s => s.avgMargin !== null).sort((a, b) => (a.avgMargin ?? 0) - (b.avgMargin ?? 0)).slice(0, 3);

  // Recommended increases: low acceptance = price too high, high acceptance = could raise
  const raiseRecommended = stats.filter(s => s.acceptanceRate >= 90 && s.count >= 3);
  const dropConsider = stats.filter(s => s.acceptanceRate < 50 && s.count >= 3);

  return Response.json({ stats, underpriced, mostProfitable, leastProfitable, raiseRecommended, dropConsider, total: prices.length });
}

// POST /api/pricing — manual entry
export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { deviceBrand, deviceModel, repairType, price, partsCost, acceptedByCustomer } = await req.json().catch(() => ({}));
  if (!repairType || typeof price !== "number")
    return Response.json({ error: "repairType and price are required" }, { status: 400 });

  const entry = await prisma.repairPrice.create({
    data: {
      shopId: user.shopId!,
      deviceBrand: deviceBrand ?? "",
      deviceModel: deviceModel ?? "",
      repairType,
      price,
      partsCost: partsCost ?? 0,
      acceptedByCustomer: acceptedByCustomer ?? true,
    },
  });

  return Response.json(entry, { status: 201 });
}

// DELETE /api/pricing?id=xxx
export async function DELETE(req: Request) {
  const user = requireAuth(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  await prisma.repairPrice.deleteMany({ where: { id, shopId: user.shopId! } });
  return Response.json({ ok: true });
}
