import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.workOrderTemplate.findMany({
    where: { shopId: user.shopId ?? undefined },
    orderBy: { name: "asc" },
  });

  return Response.json(templates);
}

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, deviceBrand, deviceModel, faultDescription, repairType, faultLevel, serviceType, defaultPrice } = body;

  if (!name || !faultDescription) {
    return Response.json({ error: "name and faultDescription are required" }, { status: 400 });
  }

  const template = await prisma.workOrderTemplate.create({
    data: {
      name,
      deviceBrand: deviceBrand ?? "",
      deviceModel: deviceModel ?? "",
      faultDescription,
      repairType: repairType ?? "",
      faultLevel: faultLevel ?? "LOW",
      serviceType: serviceType ?? "IN_STORE",
      defaultPrice: defaultPrice ? parseFloat(defaultPrice) : 0,
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