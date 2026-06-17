import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || user.shopId !== params.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.shopSettings.findUnique({
    where: { shopId: params.id },
    select: {
      defaultSlaHours: true,
      smsEnabled: true,
      smsProvider: true,
      notifyStatuses: true,
      smsLanguage: true,
      includeTrackingLink: true,
      waTemplateStatus: true,
      waTemplatePickup: true,
      waTemplateAppointment: true,
      imeiProApiKey: true,
      receiptSize: true,
    },
  });

  return Response.json({
    defaultSlaHours: settings?.defaultSlaHours ?? 24,
    smsEnabled: settings?.smsEnabled ?? false,
    smsProvider: settings?.smsProvider ?? "mock",
    notifyStatuses: settings?.notifyStatuses ?? "DONE,DELIVERED",
    smsLanguage: settings?.smsLanguage ?? "en",
    includeTrackingLink: settings?.includeTrackingLink ?? true,
    waTemplateStatus: settings?.waTemplateStatus ?? "",
    waTemplatePickup: settings?.waTemplatePickup ?? "",
    waTemplateAppointment: settings?.waTemplateAppointment ?? "",
    imeiProApiKey: settings?.imeiProApiKey ?? "",
    receiptSize: settings?.receiptSize ?? "A4",
  });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || user.role !== "ADMIN" || user.shopId !== params.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const data: Record<string, unknown> = {};

  if (typeof body.defaultSlaHours === "number" && body.defaultSlaHours >= 1)
    data.defaultSlaHours = body.defaultSlaHours;
  if (typeof body.smsEnabled === "boolean") data.smsEnabled = body.smsEnabled;
  if (["twilio_sms", "twilio_whatsapp", "mock"].includes(body.smsProvider)) data.smsProvider = body.smsProvider;
  if (typeof body.notifyStatuses === "string") data.notifyStatuses = body.notifyStatuses;
  if (["en", "fr", "ar"].includes(body.smsLanguage)) data.smsLanguage = body.smsLanguage;
  if (typeof body.includeTrackingLink === "boolean") data.includeTrackingLink = body.includeTrackingLink;
  if (typeof body.waTemplateStatus === "string") data.waTemplateStatus = body.waTemplateStatus || null;
  if (typeof body.waTemplatePickup === "string") data.waTemplatePickup = body.waTemplatePickup || null;
  if (typeof body.waTemplateAppointment === "string") data.waTemplateAppointment = body.waTemplateAppointment || null;
  if (typeof body.imeiProApiKey === "string") data.imeiProApiKey = body.imeiProApiKey.trim() || null;
  if (["A4", "THERMAL_80", "THERMAL_58"].includes(body.receiptSize)) data.receiptSize = body.receiptSize;

  const settings = await prisma.shopSettings.upsert({
    where: { shopId: params.id },
    update: data,
    create: { shopId: params.id, ...data },
    select: {
      defaultSlaHours: true,
      smsEnabled: true,
      smsProvider: true,
      notifyStatuses: true,
      smsLanguage: true,
      includeTrackingLink: true,
      waTemplateStatus: true,
      waTemplatePickup: true,
      waTemplateAppointment: true,
      imeiProApiKey: true,
      receiptSize: true,
    },
  });

  return Response.json(settings);
}
