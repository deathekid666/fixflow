import { getShopCertStats } from "@/lib/certification";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { shopId: string } }) {
  const stats = await getShopCertStats(params.shopId);
  return Response.json(stats);
}
