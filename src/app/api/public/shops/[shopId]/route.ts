import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { shopId: string } }) {
  const shop = await prisma.shop.findUnique({
    where: { id: params.shopId },
    select: { id: true, name: true, logoUrl: true, phone: true, address: true, googleMapsUrl: true },
  });
  if (!shop) return Response.json({ error: "Not found" }, { status: 404 });

  const availRows = await prisma.shopAvailability.findMany({
    where: { shopId: params.shopId },
    orderBy: { dayOfWeek: "asc" },
    select: { dayOfWeek: true, isOpen: true },
  });

  // Fall back to Mon–Fri open if availability not configured
  const availability =
    availRows.length === 7
      ? availRows
      : Array.from({ length: 7 }, (_, i) => ({
          dayOfWeek: i,
          isOpen: i >= 1 && i <= 5,
        }));

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const in30Days = new Date(today);
  in30Days.setUTCDate(today.getUTCDate() + 30);

  const closureRows = await prisma.shopClosure.findMany({
    where: { shopId: params.shopId, date: { gte: today, lt: in30Days } },
    select: { date: true },
  });

  const closures = closureRows.map(c => {
    const d = c.date;
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  });

  return Response.json({ ...shop, availability, closures });
}
