import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  if (user.shopId !== params.id && !user.isSuperAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, address, phone, whatsappPhone, email, googleMapsUrl, currency, onboardingComplete, taxEnabled, taxRate, taxLabel, city, country, lat, lng, certification } = body;

  const shop = await prisma.shop.update({
    where: { id: params.id },
    data: {
      ...(name && { name }),
      address: address !== undefined ? address || null : undefined,
      phone: phone !== undefined ? phone || null : undefined,
      whatsappPhone: whatsappPhone !== undefined ? whatsappPhone || null : undefined,
      email: email !== undefined ? email || null : undefined,
      googleMapsUrl: googleMapsUrl !== undefined ? googleMapsUrl || null : undefined,
      ...(currency && { currency }),
      ...(onboardingComplete !== undefined && { onboardingComplete }),
      ...(taxEnabled !== undefined && { taxEnabled }),
      ...(taxRate !== undefined && { taxRate: parseFloat(taxRate) || 0 }),
      ...(taxLabel && { taxLabel }),
      city: city !== undefined ? city || null : undefined,
      country: country !== undefined ? country || null : undefined,
      lat: lat !== undefined ? (lat !== "" ? parseFloat(lat) : null) : undefined,
      lng: lng !== undefined ? (lng !== "" ? parseFloat(lng) : null) : undefined,
      certification: certification !== undefined ? certification || null : undefined,
    },
  });

  return Response.json(shop);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.isSuperAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  await prisma.shop.delete({ where: { id: params.id } });
  return Response.json({ message: "Deleted" });
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findFirst({ where: { id: params.id } });
  if (!shop) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(shop);
}