import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Body required" }, { status: 400 });

  const appt = await prisma.appointment.findFirst({
    where: { id: params.id, shopId: user.shopId },
  });
  if (!appt) return Response.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.appointment.update({
    where: { id: params.id },
    data: {
      ...(body.customerName && { customerName: body.customerName.trim() }),
      ...(body.customerPhone && { customerPhone: body.customerPhone.trim() }),
      ...(body.deviceBrand && { deviceBrand: body.deviceBrand.trim() }),
      ...(body.deviceModel && { deviceModel: body.deviceModel.trim() }),
      ...(body.faultDescription && { faultDescription: body.faultDescription.trim() }),
      ...(body.scheduledAt && { scheduledAt: new Date(body.scheduledAt) }),
      ...(body.duration !== undefined && { duration: parseInt(body.duration) }),
      ...(body.status && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes?.trim() || null }),
    },
  });

  return Response.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const appt = await prisma.appointment.findFirst({
    where: { id: params.id, shopId: user.shopId },
  });
  if (!appt) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.appointment.delete({ where: { id: params.id } });
  return Response.json({ ok: true });
}
