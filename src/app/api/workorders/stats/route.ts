import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const where: Prisma.WorkOrderWhereInput = {
    deletedAt: null,
    shopId: user.shopId ?? undefined,
    ...(user.role === "ENGINEER" ? { assignedTo: user.id } : {}),
  };

  const [grouped, revenue] = await Promise.all([
    prisma.workOrder.groupBy({
      by: ["status"],
      where,
      _count: { status: true },
    }),
    prisma.workOrder.aggregate({
      where: { ...where, status: "DELIVERED" },
      _sum: { total: true, collected: true },
    }),
  ]);

  const counts: Record<string, number> = {};
  let total = 0;
  for (const g of grouped) {
    counts[g.status] = g._count.status;
    total += g._count.status;
  }

  return Response.json({
    total,
    received: counts["RECEIVED"] ?? 0,
    diagnosing: counts["DIAGNOSING"] ?? 0,
    repairing: counts["REPAIRING"] ?? 0,
    done: counts["DONE"] ?? 0,
    delivered: counts["DELIVERED"] ?? 0,
    cancelled: counts["CANCELLED"] ?? 0,
    revenue: revenue._sum.total ?? 0,
    collected: revenue._sum.collected ?? 0,
  });
}
