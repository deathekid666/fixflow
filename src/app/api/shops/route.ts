import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

import { withApiError } from "@/lib/apiError";

export const dynamic = "force-dynamic";

export const GET = withApiError(async (req: Request) => {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  // Super admin sees all shops, regular admin sees only their shop
  if (user.isSuperAdmin) {
    const shops = await prisma.shop.findMany({
      include: {
        _count: { select: { workOrders: true, users: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(shops);
  }

  // Regular admin — only their own shop
  const shops = await prisma.shop.findMany({
    where: { id: user.shopId ?? undefined },
    include: {
      _count: { select: { workOrders: true, users: true } },
    },
  });

  return Response.json(shops);
});

export const POST = withApiError(async (req: Request) => {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { name, address, phone } = await req.json();
  if (!name) return Response.json({ error: "Shop name is required" }, { status: 400 });

  const shop = await prisma.shop.create({
    data: { name, address: address || null, phone: phone || null },
  });

  return Response.json(shop, { status: 201 });
});