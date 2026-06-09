import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parts = await prisma.sparePart.findMany({
    where: { shopId: user.shopId ?? undefined, stock: { lt: 5 } },
    select: { id: true, name: true, partNumber: true, stock: true, unitPrice: true },
    orderBy: { stock: "asc" },
  });

  const outOfStock = parts.filter(p => p.stock === 0);
  const lowStock = parts.filter(p => p.stock > 0);

  return Response.json({ outOfStock, lowStock, total: parts.length });
}
