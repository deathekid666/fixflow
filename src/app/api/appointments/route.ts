import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { createNotification, getShopAdminIds } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const appointments = await prisma.appointment.findMany({
    where: {
      shopId: user.shopId,
      ...(start && end ? { scheduledAt: { gte: new Date(start), lte: new Date(end) } } : {}),
    },
    orderBy: { scheduledAt: "asc" },
  });

  return Response.json(appointments);
}

export async function POST(req: Request) {
  const user = requireAuth(req);

  const body = await req.json().catch(() => null);
  const { shopId: bodyShopId, customerName, customerPhone, deviceBrand, deviceModel, faultDescription, scheduledAt, duration, notes } = body ?? {};

  // Authenticated: use session shopId. Unauthenticated (public booking): require shopId in body.
  const shopId = user?.shopId ?? bodyShopId;
  if (!shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!user) {
    const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { id: true } });
    if (!shop) return Response.json({ error: "Shop not found" }, { status: 404 });
  }

  if (!customerName || !customerPhone || !deviceBrand || !deviceModel || !faultDescription || !scheduledAt) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (duration !== undefined && duration !== null && duration !== "") {
    const dur = parseInt(duration);
    if (Number.isNaN(dur) || dur <= 0 || dur > 480) {
      return Response.json({ error: "Duration must be between 1 and 480 minutes" }, { status: 400 });
    }
  }

  const scheduledDate = new Date(scheduledAt);
  if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    return Response.json({ error: "Appointment must be scheduled in the future" }, { status: 400 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      shopId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deviceBrand: deviceBrand.trim(),
      deviceModel: deviceModel.trim(),
      faultDescription: faultDescription.trim(),
      scheduledAt: new Date(scheduledAt),
      duration: duration ? parseInt(duration) : 60,
      notes: notes?.trim() || null,
      status: "PENDING",
    },
  });

  // Notify shop admins of new appointment
  const adminIds = await getShopAdminIds(shopId);
  const apptTime = new Date(scheduledAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  await Promise.all(
    adminIds.map((uid) =>
      createNotification(uid, "NEW_APPOINTMENT", `New appointment: ${customerName} — ${apptTime}`, {
        link: "/dashboard/appointments",
      })
    )
  );

  return Response.json(appointment, { status: 201 });
}
