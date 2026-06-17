import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string, max = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  if (!checkRateLimit(ip)) {
    return Response.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("orderNumber");

  if (!orderNumber) return Response.json({ error: "orderNumber required" }, { status: 400 });

  const order = await prisma.workOrder.findFirst({
    where: { orderNumber: { startsWith: orderNumber.toLowerCase() } },
    select: {
      id: true,
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
      shop: { select: { name: true, phone: true, whatsappPhone: true, address: true, logoUrl: true, certification: true } },
      logs: {
        select: { action: true, description: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
      rating: { select: { rating: true, comment: true } },
      attachments: {
        where: { tag: "completion" },
        select: { id: true, path: true, filename: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

  return Response.json(order);
}