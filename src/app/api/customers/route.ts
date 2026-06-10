import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  const shopFilter = user.shopId ? { shopId: user.shopId } : {};

  // Get unique customers by phone
  const orders = await prisma.workOrder.findMany({
    where: {
      ...shopFilter,
      ...(search ? {
        OR: [
          { customerName: { contains: search, mode: "insensitive" } },
          { customerPhone: { contains: search, mode: "insensitive" } },
          { customerEmail: { contains: search, mode: "insensitive" } },
        ]
      } : {}),
    },
    select: {
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      createdAt: true,
      total: true,
      collected: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by phone
  const customerMap = new Map<string, {
    name: string;
    phone: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
    totalCollected: number;
    lastVisit: string;
    statuses: string[];
  }>();

  for (const o of orders) {
    const existing = customerMap.get(o.customerPhone);
    if (existing) {
      existing.totalOrders++;
      existing.totalSpent += o.total;
      existing.totalCollected += o.collected;
      existing.statuses.push(o.status);
    } else {
      customerMap.set(o.customerPhone, {
        name: o.customerName,
        phone: o.customerPhone,
        email: o.customerEmail || "",
        totalOrders: 1,
        totalSpent: o.total,
        totalCollected: o.collected,
        lastVisit: o.createdAt.toISOString(),
        statuses: [o.status],
      });
    }
  }

  return Response.json(Array.from(customerMap.values()));
}

export async function PATCH(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.phone || !body?.name?.trim()) return Response.json({ error: "phone and name required" }, { status: 400 });

  await prisma.workOrder.updateMany({
    where: { shopId: user.shopId, customerPhone: body.phone },
    data: {
      customerName: body.name.trim(),
      customerEmail: body.email?.trim() || null,
    },
  });

  return Response.json({ ok: true });
}
