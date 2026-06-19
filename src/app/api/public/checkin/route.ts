import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/public/checkin?shopId=xxx&phone=yyy
// Looks up today's appointment for a customer at a given shop.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");
  const phone  = searchParams.get("phone")?.trim().replace(/\s+/g, "");

  if (!shopId || !phone) return Response.json({ error: "Missing shopId or phone" }, { status: 400 });

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const appointment = await prisma.appointment.findFirst({
    where: {
      shopId,
      customerPhone: { contains: phone.slice(-8) }, // match last 8 digits for flexibility
      scheduledAt: { gte: todayStart, lte: todayEnd },
      status: { not: "CANCELLED" },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return Response.json({ appointment: appointment ?? null });
}

// POST /api/public/checkin — confirm arrival
export async function POST(req: Request) {
  const { shopId, phone, customerName } = await req.json().catch(() => ({}));
  if (!shopId || !phone) return Response.json({ error: "Missing required fields" }, { status: 400 });

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const cleanPhone = String(phone).trim().replace(/\s+/g, "");

  const appointment = await prisma.appointment.findFirst({
    where: {
      shopId,
      customerPhone: { contains: cleanPhone.slice(-8) },
      scheduledAt: { gte: todayStart, lte: todayEnd },
      status: { not: "CANCELLED" },
    },
    orderBy: { scheduledAt: "asc" },
  });

  if (appointment) {
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: "CONFIRMED" },
    });
    return Response.json({ checked: true, appointment });
  }

  // Walk-in — just acknowledge
  return Response.json({ checked: true, appointment: null, walkIn: true, customerName });
}
