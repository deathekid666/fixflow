import { prisma } from "@/lib/prisma";

import { withApiError } from "@/lib/apiError";

export const dynamic = "force-dynamic";

export const GET = withApiError(async () => {
  const shops = await prisma.shop.findMany({
    where: { status: { in: ["ACTIVE", "TRIAL"] } },
    select: { id: true, name: true, logoUrl: true, phone: true, address: true, googleMapsUrl: true },
    orderBy: { name: "asc" },
  });
  return Response.json(shops);
});
