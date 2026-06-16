import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function phoneVariants(phone: string): string[] {
  const clean = phone.trim();
  const digits = clean.replace(/\D/g, "");
  const set = new Set<string>([clean, digits]);

  if (!clean.startsWith("+")) set.add(`+${digits}`);
  else set.add(digits);

  // Morocco: 06/07XXXXXXXX ↔ +212XXXXXXXXX
  if (digits.startsWith("0") && digits.length === 10) {
    set.add(`+212${digits.slice(1)}`);
    set.add(`212${digits.slice(1)}`);
  }
  if (digits.startsWith("212") && digits.length === 12) {
    set.add(`0${digits.slice(3)}`);
    set.add(`+212${digits.slice(3)}`);
  }
  // UAE: 05X → +9715X
  if (digits.startsWith("05") && digits.length === 10) {
    set.add(`+9715${digits.slice(2)}`);
  }
  if (digits.startsWith("9715") && digits.length === 12) {
    set.add(`05${digits.slice(4)}`);
  }

  return Array.from(set).filter((v) => v.replace(/\D/g, "").length >= 6);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const phone = url.searchParams.get("phone")?.trim();

  if (!phone || phone.replace(/\D/g, "").length < 6) {
    return Response.json({ error: "Phone number required" }, { status: 400 });
  }

  const variants = phoneVariants(phone);

  const orders = await prisma.workOrder.findMany({
    where: {
      customerPhone: { in: variants },
      deletedAt: null,
    },
    include: {
      shop: { select: { name: true, logoUrl: true, phone: true, address: true } },
      attachments: {
        where: { tag: { in: ["intake", "completion"] } },
        select: { id: true, path: true, tag: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { receivedAt: "desc" },
    take: 100,
  });

  const result = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    deviceBrand: o.deviceBrand,
    deviceModel: o.deviceModel,
    status: o.status,
    repairType: o.repairType,
    faultDescription: o.faultDescription,
    receivedAt: o.receivedAt,
    doneAt: o.doneAt,
    deliveredAt: o.deliveredAt,
    warrantyStart: o.warrantyStart,
    warrantyEnd: o.warrantyEnd,
    isUnderWarranty: o.isUnderWarranty,
    customerName: o.customerName,
    total: o.total,
    shop: { name: o.shop.name, logoUrl: o.shop.logoUrl, phone: o.shop.phone, address: o.shop.address },
    photos: o.attachments.filter(
      (a) => a.path.startsWith("data:image") || a.path.startsWith("https://") || a.path.startsWith("http://")
    ),
  }));

  return Response.json(result);
}
