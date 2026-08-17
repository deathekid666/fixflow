import { getShopCertStats } from "@/lib/certification";
import { requireAuth } from "@/lib/requireAuth";

import { withApiError } from "@/lib/apiError";

export const dynamic = "force-dynamic";

export const GET = withApiError(async (req: Request, { params }: { params: { shopId: string } }) => {
  const user = requireAuth(req);
  if (!user || (user.shopId !== params.shopId && !user.isSuperAdmin)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stats = await getShopCertStats(params.shopId);
  return Response.json(stats);
});
