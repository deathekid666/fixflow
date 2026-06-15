import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ count: 0, items: [] });

  const shopId = user.shopId;

  // Unread customer messages
  const messages = await prisma.customerMessage.findMany({
    where: {
      senderType: "CUSTOMER",
      read: false,
      workOrder: { shopId },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { workOrder: { select: { orderNumber: true } } },
  });

  // Low stock parts
  const lowStock = await prisma.sparePart.findMany({
    where: { shopId, stock: { lte: 3 } },
    take: 5,
    orderBy: { stock: "asc" },
  });

  const items = [
    ...messages.map((m) => ({
      id: `msg-${m.id}`,
      text: `New message on ${m.workOrder.orderNumber.slice(0, 8).toUpperCase()}`,
      time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    })),
    ...lowStock.map((p) => ({
      id: `stock-${p.id}`,
      text: `Low stock: ${p.name} (${p.stock} left)`,
      time: "Inventory alert",
    })),
  ];

  return Response.json({ count: items.length, items });
}
