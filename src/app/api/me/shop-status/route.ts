import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

import { withApiError } from "@/lib/apiError";

export const dynamic = "force-dynamic";

export const GET = withApiError(async (req: Request) => {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.isSuperAdmin) return Response.json({ suspended: false, trialExpired: false });
  if (!user.shopId) return Response.json({ suspended: false, trialExpired: false });

  const shop = await prisma.shop.findUnique({
    where: { id: user.shopId },
    select: { status: true, trialEndsAt: true },
  });

  if (!shop) return Response.json({ suspended: true, trialExpired: false });

  const suspended = shop.status === "SUSPENDED";
  const trialExpired = shop.status === "TRIAL" && shop.trialEndsAt
    ? new Date() > new Date(shop.trialEndsAt)
    : false;

  return Response.json({ suspended, trialExpired });
});