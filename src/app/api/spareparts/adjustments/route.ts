import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sparePartId = searchParams.get("sparePartId");

  const adjustments = await prisma.stockAdjustment.findMany({
    where: {
      ...(sparePartId ? { sparePartId } : {}),
      sparePart: { shopId: user.shopId ?? undefined },
    },
    include: {
      user: { select: { id: true, name: true } },
      sparePart: { select: { id: true, name: true, partNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return Response.json(adjustments);
}

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { sparePartId, quantity, type, reason } = await req.json();

  if (!sparePartId || !quantity || !type) {
    return Response.json({ error: "sparePartId, quantity and type are required" }, { status: 400 });
  }

  const validTypes = ["ADD", "REMOVE", "CORRECTION"];
  if (!validTypes.includes(type)) {
    return Response.json({ error: "type must be ADD, REMOVE or CORRECTION" }, { status: 400 });
  }

  const part = await prisma.sparePart.findFirst({
    where: { id: sparePartId, shopId: user.shopId ?? undefined },
  });
  if (!part) return Response.json({ error: "Part not found" }, { status: 404 });

  const qty = parseInt(quantity);
  const stockDelta = type === "ADD" ? qty : type === "REMOVE" ? -qty : qty - part.stock;

  const [adjustment] = await prisma.$transaction([
    prisma.stockAdjustment.create({
      data: { sparePartId, quantity: qty, type, reason, userId: user.id },
      include: { user: { select: { id: true, name: true } }, sparePart: { select: { id: true, name: true } } },
    }),
    prisma.sparePart.update({
      where: { id: sparePartId },
      data: { stock: type === "CORRECTION" ? qty : { increment: stockDelta } },
    }),
  ]);

  return Response.json(adjustment, { status: 201 });
}
