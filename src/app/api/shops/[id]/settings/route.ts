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
      checkMendApiKey: true,
      receiptSize: true,
      emailEnabled: true,
      emailDomain: true,
      emailNotifyWelcome: true,
      emailNotifyStatus: true,
      emailNotifyPickup: true,
      emailNotifyAppt: true,
      emailNotifyReminder: true,
      twilioSid: true,
      twilioToken: true,
      twilioPhone: true,
      stripePlanSelected: true,
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
    checkMendApiKey: settings?.checkMendApiKey ?? "",
    receiptSize: settings?.receiptSize ?? "A4",
    emailEnabled: settings?.emailEnabled ?? false,
    emailDomain: settings?.emailDomain ?? "",
    emailNotifyWelcome: settings?.emailNotifyWelcome ?? true,
    emailNotifyStatus: settings?.emailNotifyStatus ?? true,
    emailNotifyPickup: settings?.emailNotifyPickup ?? true,
    emailNotifyAppt: settings?.emailNotifyAppt ?? true,
    emailNotifyReminder: settings?.emailNotifyReminder ?? true,
    twilioSid: settings?.twilioSid ?? "",
    twilioToken: settings?.twilioToken ?? "",
    twilioPhone: settings?.twilioPhone ?? "",
    stripePlanSelected: settings?.stripePlanSelected ?? "",
    resendConfigured: !!process.env.RESEND_API_KEY,
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
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
  if (typeof body.checkMendApiKey === "string") data.checkMendApiKey = body.checkMendApiKey.trim() || null;
  if (["A4", "THERMAL_80", "THERMAL_58"].includes(body.receiptSize)) data.receiptSize = body.receiptSize;
  if (typeof body.emailEnabled === "boolean") data.emailEnabled = body.emailEnabled;
  if (typeof body.emailDomain === "string") data.emailDomain = body.emailDomain.trim() || null;
  if (typeof body.emailNotifyWelcome === "boolean") data.emailNotifyWelcome = body.emailNotifyWelcome;
  if (typeof body.emailNotifyStatus === "boolean") data.emailNotifyStatus = body.emailNotifyStatus;
  if (typeof body.emailNotifyPickup === "boolean") data.emailNotifyPickup = body.emailNotifyPickup;
  if (typeof body.emailNotifyAppt === "boolean") data.emailNotifyAppt = body.emailNotifyAppt;
  if (typeof body.emailNotifyReminder === "boolean") data.emailNotifyReminder = body.emailNotifyReminder;
  if (typeof body.twilioSid === "string") data.twilioSid = body.twilioSid.trim() || null;
  if (typeof body.twilioToken === "string") data.twilioToken = body.twilioToken.trim() || null;
  if (typeof body.twilioPhone === "string") data.twilioPhone = body.twilioPhone.trim() || null;

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
      checkMendApiKey: true,
      receiptSize: true,
      emailEnabled: true,
      emailDomain: true,
      emailNotifyWelcome: true,
      emailNotifyStatus: true,
      emailNotifyPickup: true,
      emailNotifyAppt: true,
      emailNotifyReminder: true,
      twilioSid: true,
      twilioToken: true,
      twilioPhone: true,
      stripePlanSelected: true,
    },
  });

  return Response.json(settings);
}
