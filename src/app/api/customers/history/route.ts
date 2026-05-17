import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");

  if (!phone) return Response.json({ error: "phone required" }, { status: 400 });

  const orders = await prisma.workOrder.findMany({
    where: {
      customerPhone: phone,
      shopId: user.shopId ?? undefined,
    },
    include: {
      assignee: { select: { name: true } },
      _count: { select: { parts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(orders);
}
