import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import {
  welcomeEmail, orderStatusUpdateEmail, deviceReadyPickupEmail,
  appointmentConfirmationEmail, appointmentReminderEmail, passwordResetEmail,
  getPreviewEmail, type EmailTemplateKey,
} from "@/lib/emailTemplates";

export const dynamic = "force-dynamic";

// Send a transactional email via Resend if RESEND_API_KEY is set.
// Falls back to console logging if no key is configured.
async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; message: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
    console.log("[EMAIL] No RESEND_API_KEY set — email logged only");
    return { ok: true, message: "logged" };
  }

  const fromName = process.env.EMAIL_FROM_NAME ?? "FixFlow";
  const fromDomain = process.env.EMAIL_FROM_DOMAIN ?? "notifications.fixflow.ma";
  const from = `${fromName} <noreply@${fromDomain}>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[EMAIL] Resend error:", err);
    return { ok: false, message: err.message ?? "Resend API error" };
  }

  return { ok: true, message: "sent" };
}

// POST /api/notifications/email
// Sends a specific email notification or a test/preview email.
export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, to, preview, workOrderId } = body as {
    type: string;
    to: string;
    preview?: boolean;
    workOrderId?: string;
  };

  if (!to || !type) return Response.json({ error: "Missing to or type" }, { status: 400 });

  // Fetch shop branding
  const shop = await prisma.shop.findUnique({
    where: { id: user.shopId! },
    select: { name: true, phone: true, address: true, email: true, logoUrl: true },
  });
  if (!shop) return Response.json({ error: "Shop not found" }, { status: 404 });

  const brand = { name: shop.name, phone: shop.phone, address: shop.address, email: shop.email, logoUrl: shop.logoUrl };

  // Preview mode — return HTML only for the template preview modal
  if (preview) {
    const template = getPreviewEmail(type as EmailTemplateKey, brand);
    return Response.json({ subject: template.subject, html: template.html });
  }

  let template: { subject: string; html: string } | null = null;

  if (type === "welcome" || type === "status" || type === "pickup") {
    if (!workOrderId) return Response.json({ error: "workOrderId required" }, { status: 400 });

    const order = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { orderNumber: true, deviceBrand: true, deviceModel: true, customerName: true, faultDescription: true, status: true, total: true, shop: { select: { currency: true } } },
    });
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://fixflow-ruddy.vercel.app"}/track/${order.orderNumber}`;

    if (type === "welcome") {
      template = welcomeEmail({ customerName: order.customerName, orderNumber: order.orderNumber, deviceBrand: order.deviceBrand, deviceModel: order.deviceModel, faultDescription: order.faultDescription, trackingUrl, brand });
    } else if (type === "status") {
      template = orderStatusUpdateEmail({ customerName: order.customerName, orderNumber: order.orderNumber, deviceBrand: order.deviceBrand, deviceModel: order.deviceModel, status: order.status, trackingUrl, brand });
    } else if (type === "pickup") {
      template = deviceReadyPickupEmail({ customerName: order.customerName, orderNumber: order.orderNumber, deviceBrand: order.deviceBrand, deviceModel: order.deviceModel, totalAmount: order.total, currency: order.shop?.currency ?? "MAD", trackingUrl, brand });
    }
  } else if (type === "test") {
    template = {
      subject: `Test email from ${shop.name}`,
      html: getPreviewEmail("status", brand).html,
    };
  }

  if (!template) return Response.json({ error: "Unknown template type" }, { status: 400 });

  const result = await sendEmail(to, template.subject, template.html);
  return Response.json(result);
}
