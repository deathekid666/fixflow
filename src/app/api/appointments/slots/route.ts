import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  return `${Math.floor(minutes / 60).toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");
  const date = searchParams.get("date"); // expected: "2026-06-15"

  if (!shopId || !date) {
    return Response.json({ error: "shopId and date are required" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
  const dayOfWeek = dayStart.getUTCDay(); // 0=Sunday

  // Check if shop exists
  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { id: true } });
  if (!shop) return Response.json({ error: "Shop not found" }, { status: 404 });

  // Check for a closure on this date
  const closure = await prisma.shopClosure.findFirst({
    where: { shopId, date: { gte: dayStart, lt: dayEnd } },
  });
  if (closure) {
    return Response.json({ closed: true, reason: closure.reason ?? "Holiday", slots: [] });
  }

  // Get availability for this day of week
  const avail = await prisma.shopAvailability.findUnique({
    where: { shopId_dayOfWeek: { shopId, dayOfWeek } },
  });
  if (!avail || !avail.isOpen) {
    return Response.json({ closed: true, reason: "Shop is closed on this day", slots: [] });
  }

  // Get non-cancelled appointments for this date
  const appointments = await prisma.appointment.findMany({
    where: {
      shopId,
      scheduledAt: { gte: dayStart, lt: dayEnd },
      status: { not: "CANCELLED" },
    },
    select: { scheduledAt: true, duration: true },
  });

  // Build slot grid
  const openMin = timeToMinutes(avail.openTime);
  const closeMin = timeToMinutes(avail.closeTime);
  const { slotDurationMinutes, maxConcurrent } = avail;

  const slots: { time: string; available: boolean; remaining: number }[] = [];

  for (let slotStart = openMin; slotStart + slotDurationMinutes <= closeMin; slotStart += slotDurationMinutes) {
    const slotEnd = slotStart + slotDurationMinutes;

    // Count appointments whose time window overlaps this slot
    const booked = appointments.filter(appt => {
      const apptStart = appt.scheduledAt.getUTCHours() * 60 + appt.scheduledAt.getUTCMinutes();
      const apptEnd = apptStart + appt.duration;
      return apptStart < slotEnd && apptEnd > slotStart;
    }).length;

    const remaining = Math.max(0, maxConcurrent - booked);
    slots.push({ time: minutesToTime(slotStart), available: remaining > 0, remaining });
  }

  return Response.json({ closed: false, slots });
}
