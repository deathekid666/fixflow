import { prisma } from "./prisma";

export const NOTIF_TYPES = {
  NEW_MESSAGE:     { icon: "💬", label: "New Message",      prefKey: "newMessage"     },
  LOW_STOCK:       { icon: "📦", label: "Low Stock",        prefKey: "lowStock"       },
  NEW_APPOINTMENT: { icon: "📅", label: "New Appointment",  prefKey: "newAppointment" },
  SLA_BREACH:      { icon: "⚠️",  label: "SLA Warning",     prefKey: "slaBreach"      },
  ORDER_OVERDUE:   { icon: "🕐", label: "Order Overdue",    prefKey: "orderOverdue"   },
  CERTIFICATION:   { icon: "🏆", label: "Certification",    prefKey: "certification"  },
  NEW_RATING:      { icon: "⭐", label: "New Rating",       prefKey: "newRating"      },
  DELIVERED:       { icon: "✅", label: "Order Delivered",  prefKey: null             },
  BOUNCE:          { icon: "🔄", label: "Bounce Repair",    prefKey: null             },
  CONTRACT_BILLED: { icon: "📄", label: "Contract Billed",  prefKey: null             },
} as const;

export type NotifType = keyof typeof NOTIF_TYPES;

export async function createNotification(
  userId: string,
  type: NotifType,
  message: string,
  opts?: { workOrderId?: string; link?: string }
) {
  const config = NOTIF_TYPES[type];
  if (config.prefKey) {
    const prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
    if (prefs && prefs[config.prefKey as keyof typeof prefs] === false) return null;
  }

  return prisma.notification.create({
    data: { type, message, userId, workOrderId: opts?.workOrderId ?? null, link: opts?.link ?? null },
  });
}

export async function getShopAdminIds(shopId: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { shopId, role: "ADMIN" },
    select: { id: true },
  });
  return users.map((u) => u.id);
}
