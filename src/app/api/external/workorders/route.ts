import { prisma } from "@/lib/prisma";
import { requireApiKey } from "@/lib/requireApiKey";

export const dynamic = "force-dynamic";

const PLAN_LIMITS = {
  FREE: { workOrders: 50 },
  PRO: { workOrders: Infinity },
  ENTERPRISE: { workOrders: Infinity },
};

type DiagnosticTest = { name: string; status: "pass" | "fail" | "skip" | string };

type Diagnostics = {
  batteryHealth?: number;
  storageTotal?: number;
  storageUsed?: number;
  ramTotal?: number;
  imeiStatus?: string;
  diagnosticTests?: DiagnosticTest[];
};

function buildDiagnosticsNote(d: Diagnostics): string {
  const lines: string[] = ["## Diagnostics Report (FixFlow Diagnostics App)\n"];

  if (d.batteryHealth != null) lines.push(`Battery Health: ${d.batteryHealth}%`);
  if (d.storageUsed != null && d.storageTotal != null) {
    lines.push(`Storage: ${d.storageUsed} GB used / ${d.storageTotal} GB total`);
  } else if (d.storageTotal != null) {
    lines.push(`Storage: ${d.storageTotal} GB total`);
  }
  if (d.ramTotal != null) lines.push(`RAM: ${d.ramTotal} GB`);
  if (d.imeiStatus) lines.push(`IMEI Status: ${d.imeiStatus}`);

  if (d.diagnosticTests?.length) {
    lines.push("\nDiagnostic Tests:");
    for (const t of d.diagnosticTests) {
      const icon =
        t.status === "pass" ? "✓" :
        t.status === "fail" ? "✗" : "—";
      lines.push(`  ${icon} ${t.name} (${t.status})`);
    }
  }

  return lines.join("\n");
}

export async function POST(req: Request) {
  const apiKeyData = await requireApiKey(req);
  if (!apiKeyData) return Response.json({ error: "Invalid or missing API key" }, { status: 401 });

  const { shopId } = apiKeyData;

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { plan: true, taxEnabled: true, taxRate: true },
  });
  if (!shop) return Response.json({ error: "Shop not found" }, { status: 404 });

  const plan = (shop.plan ?? "FREE") as keyof typeof PLAN_LIMITS;
  const limit = PLAN_LIMITS[plan]?.workOrders ?? 50;
  if (limit !== Infinity) {
    const count = await prisma.workOrder.count({ where: { shopId } });
    if (count >= limit) {
      return Response.json({
        error: `Work order limit reached (${limit} on ${plan} plan). Upgrade to PRO for unlimited orders.`,
        limitReached: true,
      }, { status: 403 });
    }
  }

  const body = await req.json();
  const {
    deviceBrand, deviceModel, serialNumber, imei,
    warrantyStart, warrantyEnd, isUnderWarranty,
    customerName, customerPhone, customerEmail,
    faultDescription, appearance, remarks,
    serviceType, repairType, faultLevel,
    diagnostics,
  }: {
    deviceBrand: string; deviceModel: string; serialNumber?: string; imei?: string;
    warrantyStart?: string; warrantyEnd?: string; isUnderWarranty?: boolean;
    customerName: string; customerPhone: string; customerEmail?: string;
    faultDescription: string; appearance?: string; remarks?: string;
    serviceType?: string; repairType?: string; faultLevel?: string;
    diagnostics?: Diagnostics;
  } = body;

  if (!deviceBrand || !deviceModel || !customerName || !customerPhone || !faultDescription) {
    return Response.json({ error: "Missing required fields: deviceBrand, deviceModel, customerName, customerPhone, faultDescription" }, { status: 400 });
  }

  // Use the shop's first admin as the creator (required FK on WorkOrder and notes)
  const adminUser = await prisma.user.findFirst({
    where: { shopId, role: "ADMIN" },
    select: { id: true },
  });
  if (!adminUser) return Response.json({ error: "No admin user found for shop" }, { status: 500 });

  // Sequential order number
  const year = new Date().getFullYear();
  const count = await prisma.workOrder.count({ where: { shopId } });
  const seq = String(count + 1).padStart(4, "0");
  const orderNumber = `wo-${year}-${seq}-${shopId.slice(0, 4)}`;

  const shopSettings = await prisma.shopSettings.findUnique({
    where: { shopId },
    select: { defaultSlaHours: true },
  });
  const slaHours = shopSettings?.defaultSlaHours ?? 24;
  const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

  const order = await prisma.workOrder.create({
    data: {
      orderNumber,
      deviceBrand, deviceModel,
      serialNumber: serialNumber ?? "",
      imei: imei ?? "",
      warrantyStart: warrantyStart ? new Date(warrantyStart) : null,
      warrantyEnd: warrantyEnd ? new Date(warrantyEnd) : null,
      isUnderWarranty: isUnderWarranty ?? false,
      customerName, customerPhone,
      customerEmail: customerEmail ?? "",
      faultDescription,
      appearance: appearance ?? "",
      remarks: remarks ?? "",
      serviceType: serviceType ?? "IN_STORE",
      repairType: repairType ?? null,
      faultLevel: faultLevel ?? "LOW",
      status: "RECEIVED",
      shopId,
      userId: adminUser.id,
      slaDeadline,
      taxRate: shop.taxEnabled ? (shop.taxRate ?? 0) : 0,
    },
  });

  await prisma.operationLog.create({
    data: {
      action: "CREATED",
      description: "Work order created via FixFlow Diagnostics App",
      workOrderId: order.id,
      userId: adminUser.id,
    },
  });

  if (diagnostics && Object.keys(diagnostics).length > 0) {
    const message = buildDiagnosticsNote(diagnostics);
    await prisma.internalNote.create({
      data: {
        message,
        workOrderId: order.id,
        userId: adminUser.id,
      },
    });
  }

  // Build tracking link from the first 6 chars of orderNumber (the sequential part)
  const trackingToken = orderNumber.split("-")[2]; // e.g. "0001" from "wo-2026-0001-abc1"
  const trackingLink = `https://fixflow-ruddy.vercel.app/track/${trackingToken}`;

  return Response.json({
    id: order.id,
    orderNumber: order.orderNumber,
    trackingLink,
    status: order.status,
    createdAt: order.createdAt,
  }, { status: 201 });
}
