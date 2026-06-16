import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const shops = await prisma.shop.findMany({
    where: { status: "ACTIVE" },
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
      workOrders: {
        where: { status: "DELIVERED", deletedAt: null },
        select: {
          id: true,
          rating: { select: { rating: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const result = shops.map((shop) => {
    const completed = shop.workOrders.length;
    const rated = shop.workOrders.filter((w) => w.rating !== null);
    const avgRating =
      rated.length > 0
        ? rated.reduce((sum, w) => sum + (w.rating?.rating ?? 0), 0) / rated.length
        : null;

    return {
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
      completedRepairs: completed,
      avgRating: avgRating !== null ? Math.round(avgRating * 10) / 10 : null,
      ratingCount: rated.length,
    };
  });

  // Featured (certified) shops first
  result.sort((a, b) => {
    if (a.certification && !b.certification) return -1;
    if (!a.certification && b.certification) return 1;
    return b.completedRepairs - a.completedRepairs;
  });

  return Response.json(result);
}
