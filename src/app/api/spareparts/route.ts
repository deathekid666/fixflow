import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const page = Math.max(parseInt(searchParams.get("page") ?? "1") || 1, 1);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50") || 50, 200);
  const skip = (page - 1) * limit;

  const where = {
    shopId: user.shopId ?? undefined,
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const [parts, total] = await Promise.all([
    prisma.sparePart.findMany({
      where,
      orderBy: { name: "asc" },
      take: limit,
      skip,
    }),
    prisma.sparePart.count({ where }),
  ]);

  // Return an array for backward compatibility with existing clients;
  // pagination metadata is exposed via response headers.
  return Response.json(parts, {
    headers: {
      "X-Total-Count": String(total),
      "X-Page": String(page),
      "X-Limit": String(limit),
    },
  });
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
