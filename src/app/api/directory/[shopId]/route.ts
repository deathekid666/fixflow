import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { shopId: string } }) {
  const shop = await prisma.shop.findFirst({
    where: { id: params.shopId, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      address: true,
      city: true,
      country: true,
      lat: true,
      lng: true,
      certification: true,
      phone: true,
      email: true,
      googleMapsUrl: true,
      workOrders: {
        where: { status: "DELIVERED", deletedAt: null },
        select: {
          id: true,
          rating: { select: { rating: true, comment: true } },
          deviceBrand: true,
          deliveredAt: true,
        },
      },
    },
  });

  if (!shop) return Response.json({ error: "Not found" }, { status: 404 });

  const completed = shop.workOrders.length;
  const rated = shop.workOrders.filter((w) => w.rating !== null);
  const avgRating =
    rated.length > 0
      ? rated.reduce((sum, w) => sum + (w.rating?.rating ?? 0), 0) / rated.length
      : null;

  const reviews = rated
    .filter((w) => w.rating?.comment)
    .slice(-10)
    .reverse()
    .map((w) => ({
      rating: w.rating!.rating,
      comment: w.rating!.comment,
      brand: w.deviceBrand,
      date: w.deliveredAt,
    }));

  return Response.json({
    id: shop.id,
    name: shop.name,
    logoUrl: shop.logoUrl,
    address: shop.address,
    city: shop.city,
    country: shop.country,
    lat: shop.lat,
    lng: shop.lng,
    certification: shop.certification,
    phone: shop.phone,
    email: shop.email,
    googleMapsUrl: shop.googleMapsUrl,
    completedRepairs: completed,
    avgRating: avgRating !== null ? Math.round(avgRating * 10) / 10 : null,
    ratingCount: rated.length,
    reviews,
  });
}
