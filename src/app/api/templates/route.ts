import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.workOrderTemplate.findMany({
    where: { shopId: user.shopId ?? undefined },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return Response.json(templates);
}

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    name, category, deviceBrand, deviceModel, faultDescription,
    repairType, faultLevel, serviceType, defaultPrice,
    estimatedDuration, defaultParts, defaultLineItems,
  } = body;

  if (!name || !faultDescription) {
    return Response.json({ error: "name and faultDescription are required" }, { status: 400 });
  }

  const template = await prisma.workOrderTemplate.create({
    data: {
      name,
      category: category ?? "",
      deviceBrand: deviceBrand ?? "",
      deviceModel: deviceModel ?? "",
      faultDescription,
      repairType: repairType ?? "",
      faultLevel: faultLevel ?? "LOW",
      serviceType: serviceType ?? "IN_STORE",
      defaultPrice: defaultPrice ? parseFloat(defaultPrice) : 0,
      estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : 0,
      defaultParts: defaultParts ?? [],
      defaultLineItems: defaultLineItems ?? [],
      shopId: user.shopId ?? "",
    },
  });

  return Response.json(template, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  await prisma.workOrderTemplate.delete({ where: { id } });
  return Response.json({ message: "Deleted" });
}