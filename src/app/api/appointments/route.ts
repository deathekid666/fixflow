import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

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
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { customerName, customerPhone, deviceBrand, deviceModel, faultDescription, scheduledAt, duration, notes } = body ?? {};

  if (!customerName || !customerPhone || !deviceBrand || !deviceModel || !faultDescription || !scheduledAt) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      shopId: user.shopId,
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

  return Response.json(appointment, { status: 201 });
}
