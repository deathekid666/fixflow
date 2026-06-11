import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const shops = await prisma.shop.findMany({
    where: { status: { in: ["ACTIVE", "TRIAL"] } },
    select: { id: true, name: true, logoUrl: true, phone: true, address: true, googleMapsUrl: true },
    orderBy: { name: "asc" },
  });
  return Response.json(shops);
}
