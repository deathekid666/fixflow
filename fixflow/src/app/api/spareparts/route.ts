import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  const parts = await prisma.sparePart.findMany({
    where: {
      shopId: user.shopId ?? undefined,
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
  });

  return Response.json(parts);
}

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.shopId) return Response.json({ error: "No shop assigned" }, { status: 400 });

  if (user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, partNumber, description, unitPrice, stock } = await req.json();

  if (!name || unitPrice === undefined) {
    return Response.json({ error: "name and unitPrice are required" }, { status: 400 });
  }

  const part = await prisma.sparePart.create({
    data: {
      name,
      partNumber,
      description,
      unitPrice: Number(unitPrice),
      stock: Number(stock ?? 0),
      shopId: user.shopId,
    },
  });

  return Response.json(part, { status: 201 });
}
