import { prisma } from "@/lib/prisma";

import { withApiError } from "@/lib/apiError";

export const dynamic = "force-dynamic";

export const GET = withApiError(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");
  const phone  = searchParams.get("phone")?.trim().replace(/\s+/g, "");

  if (!shopId || !phone) return Response.json({ error: "Missing shopId or phone" }, { status: 400 });

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  const appointment = await prisma.appointment.findFirst({
    where: {
      shopId,
      customerPhone: { contains: phone.slice(-8) },
      scheduledAt: { gte: todayStart, lte: todayEnd },
      status: { not: "CANCELLED" },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return Response.json({ appointment: appointment ?? null });
});

export const POST = withApiError(async (req: Request) => {
  const { shopId, phone, customerName } = await req.json().catch(() => ({}));
  if (!shopId || !phone) return Response.json({ error: "Missing required fields" }, { status: 400 });

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);

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
    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: "CONFIRMED", checkedInAt: now },
    });
    return Response.json({ checked: true, appointment: updated });
  }

  // Walk-in — persist to DB
  const walkIn = await prisma.walkIn.create({
    data: { shopId, customerName: String(customerName ?? "").trim() || "Walk-in", customerPhone: cleanPhone },
  });

  return Response.json({ checked: true, appointment: null, walkIn: true, walkInId: walkIn.id, customerName: walkIn.customerName });
});
