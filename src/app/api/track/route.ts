import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("orderNumber");

  if (!orderNumber) return Response.json({ error: "orderNumber required" }, { status: 400 });

  const order = await prisma.workOrder.findFirst({
    where: { orderNumber: { startsWith: orderNumber.toLowerCase() } },
    select: {
      orderNumber: true,
      deviceBrand: true,
      deviceModel: true,
      customerName: true,
      status: true,
      receivedAt: true,
      doneAt: true,
      deliveredAt: true,
      faultDescription: true,
      repairType: true,
      assignee: { select: { name: true } },
      logs: {
        select: { action: true, description: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

  return Response.json(order);
}
