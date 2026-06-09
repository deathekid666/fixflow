import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const shopFilter = user.shopId ? { shopId: user.shopId } : {};
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const orders = await prisma.workOrder.findMany({
    where: { ...shopFilter, warrantyEnd: { not: null } },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerPhone: true,
      deviceBrand: true,
      deviceModel: true,
      warrantyStart: true,
      warrantyEnd: true,
      status: true,
      total: true,
      createdAt: true,
      assignee: { select: { name: true } },
    },
    orderBy: { warrantyEnd: "asc" },
  });

  const expired = orders.filter(o => new Date(o.warrantyEnd!) < now);
  const expiringSoon = orders.filter(o => {
    const end = new Date(o.warrantyEnd!);
    return end >= now && end <= in30Days;
  });
  const active = orders.filter(o => new Date(o.warrantyEnd!) > in30Days);

  return Response.json({ active, expiringSoon, expired });
}
