// HTML email templates for FixFlow transactional emails
// Sent via Resend when RESEND_API_KEY is configured, otherwise logged to console.

export type EmailTemplate = { subject: string; html: string };

type ShopBrand = {
  name: string;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
  logoUrl?: string | null;
};

function baseLayout(content: string, brand: ShopBrand): string {
  const accentColor = "#2563eb";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${brand.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f1f5f9; color: #1e293b; }
  .wrapper { max-width: 600px; margin: 32px auto; padding: 0 16px; }
  .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: ${accentColor}; padding: 28px 32px; text-align: center; }
  .header-logo { width: 48px; height: 48px; border-radius: 12px; margin-bottom: 12px; }
  .header-title { color: white; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
  .header-sub { color: rgba(255,255,255,0.75); font-size: 13px; margin-top: 4px; }
  .body { padding: 32px; }
  .greeting { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
  p { font-size: 14px; line-height: 1.65; color: #475569; margin: 10px 0; }
  .divider { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
  .detail-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 16px 0; }
  .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; }
  .detail-row + .detail-row { border-top: 1px solid #e2e8f0; }
  .detail-label { font-size: 12px; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
  .detail-value { font-size: 13px; color: #1e293b; font-weight: 600; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .status-done { background: #dcfce7; color: #15803d; }
  .status-delivered { background: #dbeafe; color: #1d4ed8; }
  .status-received { background: #fef9c3; color: #a16207; }
  .status-default { background: #f1f5f9; color: #475569; }
  .cta-btn { display: inline-block; margin: 20px 0 8px; padding: 14px 28px; background: ${accentColor}; color: white; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.2px; }
  .footer { padding: 20px 32px 28px; text-align: center; }
  .footer p { font-size: 12px; color: #94a3b8; margin: 4px 0; }
  .footer a { color: #64748b; text-decoration: none; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      ${brand.logoUrl ? `<img src="${brand.logoUrl}" alt="${brand.name}" class="header-logo" />` : ""}
      <div class="header-title">${brand.name}</div>
      <div class="header-sub">Repair &amp; Service</div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p><strong>${brand.name}</strong></p>
      ${brand.address ? `<p>${brand.address}</p>` : ""}
      ${brand.phone ? `<p>${brand.phone}</p>` : ""}
      ${brand.email ? `<p><a href="mailto:${brand.email}">${brand.email}</a></p>` : ""}
      <hr class="divider" style="margin:12px 0"/>
      <p>Powered by <a href="https://fixflow.ma">FixFlow</a></p>
    </div>
  </div>
</div>
</body>
</html>`;
}

function statusBadgeClass(status: string): string {
  if (status === "DONE") return "status-badge status-done";
  if (status === "DELIVERED") return "status-badge status-delivered";
  if (status === "RECEIVED") return "status-badge status-received";
  return "status-badge status-default";
}

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: "Received",
  IN_PROGRESS: "In Progress",
  DONE: "Ready for Pickup",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

// ── Order Status Update ──────────────────────────────────────────────────────

export function orderStatusUpdateEmail(params: {
  customerName: string;
  orderNumber: string;
  deviceBrand: string;
  deviceModel: string;
  status: string;
  trackingUrl?: string;
  brand: ShopBrand;
}): EmailTemplate {
  const statusLabel = STATUS_LABELS[params.status] ?? params.status;
  const subject = `Your repair is ${statusLabel} — ${params.brand.name}`;
  const content = `
    <div class="greeting">Hi ${params.customerName} 👋</div>
    <p>We have an update on your repair. Here's what's happening with your device:</p>
    <div class="detail-box">
      <div class="detail-row">
        <span class="detail-label">Order #</span>
        <span class="detail-value">${params.orderNumber}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Device</span>
        <span class="detail-value">${params.deviceBrand} ${params.deviceModel}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status</span>
        <span class="detail-value"><span class="${statusBadgeClass(params.status)}">${statusLabel}</span></span>
      </div>
    </div>
    ${params.status === "DONE" ? `<p><strong>Your device is ready!</strong> You can come pick it up at our shop during opening hours.</p>` : ""}
    ${params.trackingUrl ? `<a href="${params.trackingUrl}" class="cta-btn">Track Your Repair</a>` : ""}
    <hr class="divider"/>
    <p>Questions? Reply to this email or contact us directly.</p>
  `;
  return { subject, html: baseLayout(content, params.brand) };
}

// ── Device Ready for Pickup ──────────────────────────────────────────────────

export function deviceReadyPickupEmail(params: {
  customerName: string;
  orderNumber: string;
  deviceBrand: string;
  deviceModel: string;
  totalAmount: number;
  currency: string;
  trackingUrl?: string;
  brand: ShopBrand;
}): EmailTemplate {
  const formatted = new Intl.NumberFormat("en", { style: "currency", currency: params.currency, minimumFractionDigits: 2 }).format(params.totalAmount);
  const subject = `Your ${params.deviceBrand} is ready! 🎉 — ${params.brand.name}`;
  const content = `
    <div class="greeting">Great news, ${params.customerName}! 🎉</div>
    <p>Your device has been repaired and is ready for pickup. Come by whenever it's convenient for you.</p>
    <div class="detail-box">
      <div class="detail-row">
        <span class="detail-label">Order #</span>
        <span class="detail-value">${params.orderNumber}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Device</span>
        <span class="detail-value">${params.deviceBrand} ${params.deviceModel}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Amount Due</span>
        <span class="detail-value" style="color:#16a34a;font-size:16px">${formatted}</span>
      </div>
    </div>
    <p>Please bring this confirmation when you pick up your device.</p>
    ${params.trackingUrl ? `<a href="${params.trackingUrl}" class="cta-btn">View Order Details</a>` : ""}
    <hr class="divider"/>
    <p style="font-size:12px;color:#94a3b8">If you have any questions before pickup, don't hesitate to reach out.</p>
  `;
  return { subject, html: baseLayout(content, params.brand) };
}

// ── Appointment Confirmation ────────────────────────────────────────────────

export function appointmentConfirmationEmail(params: {
  customerName: string;
  deviceBrand: string;
  deviceModel: string;
  scheduledAt: string;
  notes?: string | null;
  brand: ShopBrand;
}): EmailTemplate {
  const subject = `Appointment confirmed — ${params.brand.name}`;
  const date = new Date(params.scheduledAt).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" });
  const content = `
    <div class="greeting">Your appointment is confirmed ✅</div>
    <p>Hi ${params.customerName}, we've got your appointment booked. Here are the details:</p>
    <div class="detail-box">
      <div class="detail-row">
        <span class="detail-label">Date &amp; Time</span>
        <span class="detail-value">${date}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Device</span>
        <span class="detail-value">${params.deviceBrand} ${params.deviceModel}</span>
      </div>
      ${params.notes ? `<div class="detail-row"><span class="detail-label">Notes</span><span class="detail-value">${params.notes}</span></div>` : ""}
    </div>
    <p>Please arrive on time. If you need to reschedule, contact us as soon as possible.</p>
    ${params.brand.address ? `<p><strong>📍 Address:</strong> ${params.brand.address}</p>` : ""}
    <hr class="divider"/>
    <p style="font-size:12px;color:#94a3b8">See you soon!</p>
  `;
  return { subject, html: baseLayout(content, params.brand) };
}

// ── Appointment Reminder ─────────────────────────────────────────────────────

export function appointmentReminderEmail(params: {
  customerName: string;
  deviceBrand: string;
  deviceModel: string;
  scheduledAt: string;
  brand: ShopBrand;
}): EmailTemplate {
  const subject = `Reminder: Your appointment tomorrow — ${params.brand.name}`;
  const date = new Date(params.scheduledAt).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" });
  const content = `
    <div class="greeting">Just a friendly reminder 🔔</div>
    <p>Hi ${params.customerName}, your repair appointment is coming up tomorrow:</p>
    <div class="detail-box">
      <div class="detail-row">
        <span class="detail-label">Date &amp; Time</span>
        <span class="detail-value">${date}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Device</span>
        <span class="detail-value">${params.deviceBrand} ${params.deviceModel}</span>
      </div>
    </div>
    ${params.brand.address ? `<p><strong>📍 Address:</strong> ${params.brand.address}</p>` : ""}
    <p>Need to reschedule? Contact us at ${params.brand.phone ?? params.brand.email ?? "the shop"} as soon as possible.</p>
  `;
  return { subject, html: baseLayout(content, params.brand) };
}

// ── Welcome Email ────────────────────────────────────────────────────────────

export function welcomeEmail(params: {
  customerName: string;
  orderNumber: string;
  deviceBrand: string;
  deviceModel: string;
  faultDescription: string;
  trackingUrl?: string;
  brand: ShopBrand;
}): EmailTemplate {
  const subject = `We've received your ${params.deviceBrand} — ${params.brand.name}`;
  const content = `
    <div class="greeting">Welcome, ${params.customerName}! 👋</div>
    <p>Thank you for choosing <strong>${params.brand.name}</strong>. We've received your device and will get started right away.</p>
    <div class="detail-box">
      <div class="detail-row">
        <span class="detail-label">Order #</span>
        <span class="detail-value">${params.orderNumber}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Device</span>
        <span class="detail-value">${params.deviceBrand} ${params.deviceModel}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Issue</span>
        <span class="detail-value">${params.faultDescription}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status</span>
        <span class="detail-value"><span class="status-badge status-received">Received</span></span>
      </div>
    </div>
    <p>We'll notify you by email as your repair progresses. You can also track it online anytime.</p>
    ${params.trackingUrl ? `<a href="${params.trackingUrl}" class="cta-btn">Track Your Repair</a>` : ""}
    <hr class="divider"/>
    <p style="font-size:12px;color:#94a3b8">Keep this email for your records. Your order number is <strong>${params.orderNumber}</strong>.</p>
  `;
  return { subject, html: baseLayout(content, params.brand) };
}

// ── Password Reset ───────────────────────────────────────────────────────────

export function passwordResetEmail(params: {
  name: string;
  resetUrl: string;
  brand: ShopBrand;
}): EmailTemplate {
  const subject = `Reset your FixFlow password — ${params.brand.name}`;
  const content = `
    <div class="greeting">Password reset request 🔐</div>
    <p>Hi ${params.name}, we received a request to reset your FixFlow password.</p>
    <p>Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
    <a href="${params.resetUrl}" class="cta-btn">Reset Password</a>
    <hr class="divider"/>
    <p>If you didn't request a password reset, you can safely ignore this email — your password won't change.</p>
    <p style="font-size:12px;color:#94a3b8;margin-top:8px">If the button doesn't work, copy this URL into your browser:<br/><span style="color:#64748b;word-break:break-all">${params.resetUrl}</span></p>
  `;
  return { subject, html: baseLayout(content, params.brand) };
}

// ── Template preview stubs ───────────────────────────────────────────────────

export const EMAIL_TEMPLATE_TYPES = [
  { key: "welcome",      label: "Welcome / Received",       icon: "👋", desc: "Sent when a new work order is created" },
  { key: "status",       label: "Status Update",             icon: "🔄", desc: "Sent when repair status changes" },
  { key: "pickup",       label: "Ready for Pickup",          icon: "🎉", desc: "Sent when device repair is complete" },
  { key: "appointment",  label: "Appointment Confirmation",  icon: "📅", desc: "Sent when appointment is booked" },
  { key: "reminder",     label: "Appointment Reminder",      icon: "🔔", desc: "Sent 24h before appointment" },
  { key: "password",     label: "Password Reset",            icon: "🔐", desc: "Sent when user requests password reset" },
] as const;

export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_TYPES)[number]["key"];

export function getPreviewEmail(key: EmailTemplateKey, brand: ShopBrand): EmailTemplate {
  const sampleBrand: ShopBrand = { ...brand, name: brand.name || "My Repair Shop" };
  const sampleCustomer = "Alex Johnson";

  switch (key) {
    case "welcome":
      return welcomeEmail({ customerName: sampleCustomer, orderNumber: "WO-2026-ABC123", deviceBrand: "Apple", deviceModel: "iPhone 15 Pro", faultDescription: "Cracked screen replacement", trackingUrl: "https://fixflow.ma/track/WO-2026-ABC123", brand: sampleBrand });
    case "status":
      return orderStatusUpdateEmail({ customerName: sampleCustomer, orderNumber: "WO-2026-ABC123", deviceBrand: "Apple", deviceModel: "iPhone 15 Pro", status: "IN_PROGRESS", trackingUrl: "https://fixflow.ma/track/WO-2026-ABC123", brand: sampleBrand });
    case "pickup":
      return deviceReadyPickupEmail({ customerName: sampleCustomer, orderNumber: "WO-2026-ABC123", deviceBrand: "Apple", deviceModel: "iPhone 15 Pro", totalAmount: 350, currency: "MAD", trackingUrl: "https://fixflow.ma/track/WO-2026-ABC123", brand: sampleBrand });
    case "appointment":
      return appointmentConfirmationEmail({ customerName: sampleCustomer, deviceBrand: "Samsung", deviceModel: "Galaxy S24", scheduledAt: new Date(Date.now() + 86400000).toISOString(), notes: "Bring original charger", brand: sampleBrand });
    case "reminder":
      return appointmentReminderEmail({ customerName: sampleCustomer, deviceBrand: "Samsung", deviceModel: "Galaxy S24", scheduledAt: new Date(Date.now() + 86400000).toISOString(), brand: sampleBrand });
    case "password":
      return passwordResetEmail({ name: sampleCustomer, resetUrl: "https://fixflow.ma/reset-password?token=sample123", brand: sampleBrand });
  }
}
