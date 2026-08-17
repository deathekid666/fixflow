import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

import { withApiError } from "@/lib/apiError";

export const dynamic = "force-dynamic";

export const GET = withApiError(async (req: Request) => {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.isSuperAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const shops = await prisma.shop.findMany({
    include: {
      _count: { select: { workOrders: true, users: true } },
      users: { where: { role: "ADMIN" }, select: { name: true, email: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(shops);
});

export const PATCH = withApiError(async (req: Request) => {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.isSuperAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { shopId, status, plan } = await req.json();
  if (!shopId) return Response.json({ error: "shopId required" }, { status: 400 });

  const shop = await prisma.shop.update({
    where: { id: shopId },
    data: {
      ...(status && { status }),
      ...(plan && { plan }),
    },
  });

  return Response.json(shop);
});