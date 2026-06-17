export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://fixflow-ruddy.vercel.app";

export const DEFAULT_TEMPLATES = {
  statusUpdate: "Hi {customerName}, your *{deviceBrand} {deviceModel}* repair status is now: *{status}*. Track your repair here: {trackingLink}",
  readyPickup: "Hi {customerName}, great news! 🎉 Your *{deviceBrand} {deviceModel}* is ready for pickup. Come visit us anytime!",
  appointment: "Hi {customerName}, your appointment is confirmed! 📅 *{date} at {time}* — {deviceBrand} {deviceModel}. See you then! — {shopName}",
};

export function buildWaUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (!cleaned) return "#";
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    RECEIVED: "Received",
    DIAGNOSING: "Diagnosing",
    REPAIRING: "In Repair",
    DONE: "Ready for Pickup",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };
  return map[status] ?? status;
}
