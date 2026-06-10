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

export async function DELETE(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { phone } = await req.json().catch(() => ({}));
  if (!phone) return Response.json({ error: "phone required" }, { status: 400 });

  const workOrders = await prisma.workOrder.findMany({
    where: { shopId: user.shopId, customerPhone: phone },
    select: { id: true },
  });
  const ids = workOrders.map(o => o.id);
  if (ids.length === 0) return Response.json({ ok: true });

  await prisma.$transaction([
    prisma.customerMessage.deleteMany({ where: { workOrderId: { in: ids } } }),
    prisma.satisfactionRating.deleteMany({ where: { workOrderId: { in: ids } } }),
    prisma.notification.deleteMany({ where: { workOrderId: { in: ids } } }),
    prisma.internalNote.deleteMany({ where: { workOrderId: { in: ids } } }),
    prisma.diagnosisCheck.deleteMany({ where: { workOrderId: { in: ids } } }),
    prisma.payment.deleteMany({ where: { workOrderId: { in: ids } } }),
    prisma.smsNotification.deleteMany({ where: { workOrderId: { in: ids } } }),
    prisma.workOrderPart.deleteMany({ where: { workOrderId: { in: ids } } }),
    prisma.quotationLineItem.deleteMany({ where: { workOrderId: { in: ids } } }),
    prisma.operationLog.deleteMany({ where: { workOrderId: { in: ids } } }),
    prisma.workOrderAttachment.deleteMany({ where: { workOrderId: { in: ids } } }),
    prisma.bounceRepair.deleteMany({ where: { workOrderId: { in: ids } } }),
    prisma.workOrder.deleteMany({ where: { id: { in: ids } } }),
  ]);

  return Response.json({ ok: true });
}
