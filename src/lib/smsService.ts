// Customer SMS/WhatsApp notification service.
// Provider is selected via ShopSettings.smsProvider:
//   "twilio_sms"       → regular SMS via Twilio
//   "twilio_whatsapp"  → WhatsApp via Twilio Business API
//   "mock"             → logs to console, no real send (default/test)
//
// Required env vars for Twilio:
//   TWILIO_ACCOUNT_SID   – your Account SID
//   TWILIO_AUTH_TOKEN    – your Auth Token
//   TWILIO_PHONE_NUMBER  – your Twilio number, e.g. +12015551234  (for SMS)
//   TWILIO_WHATSAPP_FROM – Twilio WhatsApp sender, e.g. whatsapp:+14155238886

export type SmsProvider = "twilio_sms" | "twilio_whatsapp" | "mock";
export type SmsLang = "en" | "fr" | "ar";
export type NotifiableStatus = "DIAGNOSING" | "REPAIRING" | "DONE" | "DELIVERED" | "CANCELLED";

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: SmsProvider;
}

// ── Message templates ────────────────────────────────────────────────────────

type TemplateVars = {
  customerName: string;
  deviceBrand: string;
  deviceModel: string;
  orderNumber: string;
  shopName: string;
  trackingUrl?: string;
};

type Templates = Record<NotifiableStatus, (v: TemplateVars) => string>;

const TEMPLATES: Record<SmsLang, Templates> = {
  en: {
    DIAGNOSING: (v) =>
      `Hi ${v.customerName}, your ${v.deviceBrand} ${v.deviceModel} (#${v.orderNumber}) is now being diagnosed at ${v.shopName}.${v.trackingUrl ? ` Track: ${v.trackingUrl}` : ""}`,
    REPAIRING: (v) =>
      `Hi ${v.customerName}, repairs have started on your ${v.deviceBrand} ${v.deviceModel} (#${v.orderNumber}) at ${v.shopName}.${v.trackingUrl ? ` Track: ${v.trackingUrl}` : ""}`,
    DONE: (v) =>
      `✅ Hi ${v.customerName}, your ${v.deviceBrand} ${v.deviceModel} (#${v.orderNumber}) repair is DONE and ready for pickup at ${v.shopName}!${v.trackingUrl ? ` Track: ${v.trackingUrl}` : ""}`,
    DELIVERED: (v) =>
      `✅ Hi ${v.customerName}, your ${v.deviceBrand} ${v.deviceModel} (#${v.orderNumber}) has been delivered. Thank you for choosing ${v.shopName}!`,
    CANCELLED: (v) =>
      `Hi ${v.customerName}, work order #${v.orderNumber} for your ${v.deviceBrand} ${v.deviceModel} at ${v.shopName} has been cancelled. Please contact us for more info.`,
  },
  fr: {
    DIAGNOSING: (v) =>
      `Bonjour ${v.customerName}, votre ${v.deviceBrand} ${v.deviceModel} (#${v.orderNumber}) est en cours de diagnostic chez ${v.shopName}.${v.trackingUrl ? ` Suivi: ${v.trackingUrl}` : ""}`,
    REPAIRING: (v) =>
      `Bonjour ${v.customerName}, la réparation de votre ${v.deviceBrand} ${v.deviceModel} (#${v.orderNumber}) a commencé chez ${v.shopName}.${v.trackingUrl ? ` Suivi: ${v.trackingUrl}` : ""}`,
    DONE: (v) =>
      `✅ Bonjour ${v.customerName}, votre ${v.deviceBrand} ${v.deviceModel} (#${v.orderNumber}) est réparé et prêt à être récupéré chez ${v.shopName} !${v.trackingUrl ? ` Suivi: ${v.trackingUrl}` : ""}`,
    DELIVERED: (v) =>
      `✅ Bonjour ${v.customerName}, votre ${v.deviceBrand} ${v.deviceModel} (#${v.orderNumber}) a été livré. Merci de choisir ${v.shopName} !`,
    CANCELLED: (v) =>
      `Bonjour ${v.customerName}, le bon de travail #${v.orderNumber} pour votre ${v.deviceBrand} ${v.deviceModel} chez ${v.shopName} a été annulé. Contactez-nous pour plus d'infos.`,
  },
  ar: {
    DIAGNOSING: (v) =>
      `مرحباً ${v.customerName}، جهازك ${v.deviceBrand} ${v.deviceModel} (${v.orderNumber}#) قيد التشخيص الآن في ${v.shopName}.${v.trackingUrl ? ` تتبع: ${v.trackingUrl}` : ""}`,
    REPAIRING: (v) =>
      `مرحباً ${v.customerName}، بدأت إصلاح ${v.deviceBrand} ${v.deviceModel} (${v.orderNumber}#) في ${v.shopName}.${v.trackingUrl ? ` تتبع: ${v.trackingUrl}` : ""}`,
    DONE: (v) =>
      `✅ مرحباً ${v.customerName}، تمت إصلاح ${v.deviceBrand} ${v.deviceModel} (${v.orderNumber}#) وجاهز للاستلام من ${v.shopName}!${v.trackingUrl ? ` تتبع: ${v.trackingUrl}` : ""}`,
    DELIVERED: (v) =>
      `✅ مرحباً ${v.customerName}، تم تسليم ${v.deviceBrand} ${v.deviceModel} (${v.orderNumber}#). شكراً لاختيارك ${v.shopName}!`,
    CANCELLED: (v) =>
      `مرحباً ${v.customerName}، تم إلغاء طلب الإصلاح ${v.orderNumber}# لجهاز ${v.deviceBrand} ${v.deviceModel} في ${v.shopName}. تواصل معنا للمزيد.`,
  },
};

// ── Providers ────────────────────────────────────────────────────────────────

async function sendViaTwilio(to: string, message: string, whatsapp: boolean): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = whatsapp
    ? (process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886")
    : process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.warn("[SMS] Twilio credentials not configured — falling back to mock");
    console.log(`[SMS MOCK] To: ${to} | ${message}`);
    return { success: false, error: "Twilio credentials not configured", provider: whatsapp ? "twilio_whatsapp" : "twilio_sms" };
  }

  const toFormatted = whatsapp ? `whatsapp:${to}` : to;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;

  try {
    const body = new URLSearchParams({ To: toFormatted, From: from, Body: message });
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    const data = await resp.json() as { sid?: string; message?: string };
    if (!resp.ok) return { success: false, error: data.message ?? "Twilio error", provider: whatsapp ? "twilio_whatsapp" : "twilio_sms" };
    return { success: true, messageId: data.sid, provider: whatsapp ? "twilio_whatsapp" : "twilio_sms" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg, provider: whatsapp ? "twilio_whatsapp" : "twilio_sms" };
  }
}

async function sendMock(to: string, message: string): Promise<SendResult> {
  console.log(`[SMS MOCK] To: ${to}\n${message}`);
  return { success: true, messageId: `mock_${Date.now()}`, provider: "mock" };
}

// ── Public API ───────────────────────────────────────────────────────────────

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://fixflow-ruddy.vercel.app";

export function buildMessage(
  status: NotifiableStatus,
  vars: TemplateVars,
  lang: SmsLang = "en",
): string {
  const langTemplates = TEMPLATES[lang] ?? TEMPLATES.en;
  return langTemplates[status](vars);
}

export async function sendNotification(
  to: string,
  message: string,
  provider: SmsProvider,
): Promise<SendResult> {
  switch (provider) {
    case "twilio_sms":       return sendViaTwilio(to, message, false);
    case "twilio_whatsapp":  return sendViaTwilio(to, message, true);
    default:                 return sendMock(to, message);
  }
}

export function shouldNotify(status: string, notifyStatuses: string): boolean {
  return notifyStatuses.split(",").map(s => s.trim()).includes(status);
}

// Legacy compat — kept so existing import in status route compiles
export const smsService = {
  send: (to: string, message: string) => sendMock(to, message),
  buildDeliveryMessage: (customerName: string, orderNumber: string, deviceModel: string) =>
    TEMPLATES.en.DELIVERED({ customerName, orderNumber, deviceModel, deviceBrand: "", shopName: "your repair shop" }),
};
