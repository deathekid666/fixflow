import { prisma } from "./prisma";

export const PERMISSIONS = [
  "VIEW_ALL_ORDERS",
  "VIEW_ASSIGNED_ORDERS_ONLY",
  "CREATE_ORDERS",
  "EDIT_ORDERS",
  "DELETE_ORDERS",
  "VIEW_FINANCIALS",
  "EDIT_QUOTATION",
  "RECORD_PAYMENTS",
  "VIEW_CUSTOMERS",
  "EDIT_CUSTOMERS",
  "VIEW_INVENTORY",
  "EDIT_INVENTORY",
  "VIEW_REPORTS",
  "VIEW_ANALYTICS",
  "MANAGE_ENGINEERS",
  "MANAGE_SETTINGS",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  VIEW_ALL_ORDERS: "View All Orders",
  VIEW_ASSIGNED_ORDERS_ONLY: "View Assigned Orders Only",
  CREATE_ORDERS: "Create Orders",
  EDIT_ORDERS: "Edit Orders",
  DELETE_ORDERS: "Delete Orders",
  VIEW_FINANCIALS: "View Financials",
  EDIT_QUOTATION: "Edit Quotation / Pricing",
  RECORD_PAYMENTS: "Record Payments",
  VIEW_CUSTOMERS: "View Customers",
  EDIT_CUSTOMERS: "Edit Customer Info",
  VIEW_INVENTORY: "View Inventory",
  EDIT_INVENTORY: "Edit Inventory",
  VIEW_REPORTS: "View Reports",
  VIEW_ANALYTICS: "View Analytics",
  MANAGE_ENGINEERS: "Manage Engineers",
  MANAGE_SETTINGS: "Manage Settings",
};

export const PERMISSION_GROUPS: { label: string; perms: Permission[] }[] = [
  {
    label: "Work Orders",
    perms: ["VIEW_ALL_ORDERS", "VIEW_ASSIGNED_ORDERS_ONLY", "CREATE_ORDERS", "EDIT_ORDERS", "DELETE_ORDERS"],
  },
  {
    label: "Financials",
    perms: ["VIEW_FINANCIALS", "EDIT_QUOTATION", "RECORD_PAYMENTS"],
  },
  {
    label: "Customers",
    perms: ["VIEW_CUSTOMERS", "EDIT_CUSTOMERS"],
  },
  {
    label: "Inventory",
    perms: ["VIEW_INVENTORY", "EDIT_INVENTORY"],
  },
  {
    label: "Reports & Analytics",
    perms: ["VIEW_REPORTS", "VIEW_ANALYTICS"],
  },
  {
    label: "Administration",
    perms: ["MANAGE_ENGINEERS", "MANAGE_SETTINGS"],
  },
];

// Defaults for ENGINEER role — what they can do before any admin override
export const ENGINEER_DEFAULTS: Record<Permission, boolean> = {
  VIEW_ALL_ORDERS: false,
  VIEW_ASSIGNED_ORDERS_ONLY: true,
  CREATE_ORDERS: true,
  EDIT_ORDERS: true,
  DELETE_ORDERS: false,
  VIEW_FINANCIALS: false,
  EDIT_QUOTATION: true,
  RECORD_PAYMENTS: false,
  VIEW_CUSTOMERS: true,
  EDIT_CUSTOMERS: false,
  VIEW_INVENTORY: true,
  EDIT_INVENTORY: false,
  VIEW_REPORTS: false,
  VIEW_ANALYTICS: false,
  MANAGE_ENGINEERS: false,
  MANAGE_SETTINGS: false,
};

// 30-second in-memory cache keyed by "shopId:role"
const permCache = new Map<string, { resolved: Record<Permission, boolean>; expires: number }>();

export function bustPermCache(shopId: string, role: string) {
  permCache.delete(`${shopId}:${role}`);
}

export async function resolvePerms(shopId: string, role: string): Promise<Record<Permission, boolean>> {
  const key = `${shopId}:${role}`;
  const now = Date.now();
  const cached = permCache.get(key);
  if (cached && cached.expires > now) return cached.resolved;

  const rows = await prisma.rolePermission.findMany({ where: { shopId, role } });
  const resolved = { ...ENGINEER_DEFAULTS } as Record<Permission, boolean>;
  for (const row of rows) {
    if (PERMISSIONS.includes(row.permission as Permission)) {
      resolved[row.permission as Permission] = row.enabled;
    }
  }
  permCache.set(key, { resolved, expires: now + 30_000 });
  return resolved;
}

export async function checkPerm(
  shopId: string | null | undefined,
  role: string,
  permission: Permission,
): Promise<boolean> {
  if (role === "ADMIN") return true;
  if (!shopId) return false;
  const perms = await resolvePerms(shopId, role);
  return perms[permission] ?? false;
}
