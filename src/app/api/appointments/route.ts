import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { createNotification, getShopAdminIds } from "@/lib/notifications";
import { pushToUser } from "@/lib/pushNotify";

import { withApiError } from "@/lib/apiError";

export const dynamic = "force-dynamic";

export const GET = withApiError(async (req: Request) => {
  const user = requireAuth(req);
  if (!user || !user.shopId)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const appointments = await prisma.appointment.findMany({
    where: {
      shopId: user.shopId,
      ...(start && end
        ? { scheduledAt: { gte: new Date(start), lte: new Date(end) } }
        : {}),
    },
    orderBy: { scheduledAt: "asc" },
  });

  return Response.json(appointments);
});

export const POST = withApiError(async (req: Request) => {
  const user = requireAuth(req);

  const body = await req.json().catch(() => null);
  const {
    shopId: bodyShopId,
    customerName,
    customerPhone,
    deviceBrand,
    deviceModel,
    faultDescription,
    scheduledAt,
    duration,
    notes,
  } = body ?? {};

  // Authenticated: use session shopId. Unauthenticated (public booking): require shopId in body.
  const shopId = bodyShopId ?? user?.shopId;
  if (typeof shopId !== "string" || !shopId)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!user) {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true },
    });
    if (!shop)
      return Response.json({ error: "Shop not found" }, { status: 404 });
  }

  if (
    ![
      customerName,
      customerPhone,
      deviceBrand,
      deviceModel,
      faultDescription,
      scheduledAt,
    ].every(
      (value) =>
        typeof value === "string" &&
        value.trim().length > 0 &&
        value.length <= 5000,
    ) ||
    (notes != null && typeof notes !== "string")
  ) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (duration !== undefined && duration !== null && duration !== "") {
    const dur = Number(duration);
    if (!Number.isInteger(dur) || dur <= 0 || dur > 480) {
      return Response.json(
        { error: "Duration must be between 1 and 480 minutes" },
        { status: 400 },
      );
    }
  }

  const scheduledDate = new Date(scheduledAt);
  if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    return Response.json(
      { error: "Appointment must be scheduled in the future" },
      { status: 400 },
    );
  }

  const dayStart = new Date(scheduledDate);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 86400000);
  const dayOfWeek = scheduledDate.getUTCDay();
  let appointment;
  try {
    appointment = await prisma.$transaction(
      async (tx) => {
        const rows = await tx.shopAvailability.findMany({ where: { shopId } });
        const availability = rows.length
          ? rows.find((row) => row.dayOfWeek === dayOfWeek)
          : {
              isOpen: dayOfWeek >= 1 && dayOfWeek <= 5,
              openTime: "09:00",
              closeTime: "18:00",
              slotDurationMinutes: 60,
              maxConcurrent: 2,
            };
        const closure = await tx.shopClosure.findFirst({
          where: { shopId, date: { gte: dayStart, lt: dayEnd } },
        });
        if (!availability?.isOpen || closure) throw new Error("BOOKING_CLOSED");
        const minutes = (time: string) => {
          const [h, m] = time.split(":").map(Number);
          return h * 60 + m;
        };
        const start =
          scheduledDate.getUTCHours() * 60 + scheduledDate.getUTCMinutes();
        const bookingDuration = duration
          ? Number(duration)
          : availability.slotDurationMinutes;
        const open = minutes(availability.openTime),
          close = minutes(availability.closeTime);
        if (
          availability.slotDurationMinutes < 1 ||
          availability.maxConcurrent < 1 ||
          start < open ||
          start + bookingDuration > close ||
          (start - open) % availability.slotDurationMinutes !== 0 ||
          scheduledDate.getUTCSeconds() !== 0 ||
          scheduledDate.getUTCMilliseconds() !== 0
        )
          throw new Error("BOOKING_SLOT");
        const existing = await tx.appointment.findMany({
          where: {
            shopId,
            scheduledAt: {
              gte: new Date(dayStart.getTime() - 86400000),
              lt: new Date(scheduledDate.getTime() + bookingDuration * 60000),
            },
            status: { not: "CANCELLED" },
          },
          select: { scheduledAt: true, duration: true },
        });
        const overlapping = existing.filter(
          (a) =>
            a.scheduledAt.getTime() + a.duration * 60000 >
            scheduledDate.getTime(),
        ).length;
        if (overlapping >= availability.maxConcurrent)
          throw new Error("BOOKING_FULL");
        return tx.appointment.create({
          data: {
            shopId,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            deviceBrand: deviceBrand.trim(),
            deviceModel: deviceModel.trim(),
            faultDescription: faultDescription.trim(),
            scheduledAt: new Date(scheduledAt),
            duration: bookingDuration,
            notes: notes?.trim() || null,
            status: "PENDING",
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("BOOKING_"))
      return Response.json(
        {
          error:
            "This appointment time is no longer available. Please choose another slot.",
        },
        { status: 409 },
      );
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    )
      return Response.json(
        {
          error:
            "Availability changed. Please refresh the slots and try again.",
        },
        { status: 409 },
      );
    throw error;
  }

  // Notify shop admins of new appointment (in-app + push)
  try {
    const adminIds = await getShopAdminIds(shopId);
    const apptTime = new Date(scheduledAt).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    await Promise.all(
      adminIds.map(async (uid) => {
        await createNotification(
          uid,
          "NEW_APPOINTMENT",
          `New appointment: ${customerName} — ${apptTime}`,
          {
            link: "/dashboard/appointments",
          },
        );
        await pushToUser(uid, {
          title: "📅 New Appointment",
          body: `${customerName} — ${deviceBrand} ${deviceModel} at ${apptTime}`,
          url: "/dashboard/appointments",
          tag: "appointment",
        });
      }),
    );
  } catch {
    console.error("Appointment saved; notification delivery failed");
  }
  return Response.json(appointment, { status: 201 });
});
