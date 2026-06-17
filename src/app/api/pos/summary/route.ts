import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: today },
      workOrder: { shopId: user.shopId ?? undefined },
    },
    select: { amount: true, method: true },
  });

  const byMethod: Record<string, number> = {};
  let total = 0;

  for (const p of payments) {
    byMethod[p.method] = (byMethod[p.method] ?? 0) + p.amount;
    total += p.amount;
  }

  return Response.json({ total, byMethod, count: payments.length });
}
