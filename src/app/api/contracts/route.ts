import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const contracts = await prisma.contract.findMany({
    where: {
      shopId: user.shopId,
      ...(status ? { status } : {}),
    },
    orderBy: { nextBillingDate: "asc" },
  });

  return Response.json(contracts);
}

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { customerPhone, customerName, deviceBrand, deviceModel, description, monthlyPrice, startDate, endDate, notes } = body ?? {};

  if (!customerPhone || !customerName || !deviceBrand || !deviceModel || !startDate) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const start = new Date(startDate);
  const nextBillingDate = new Date(start);
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

  const contract = await prisma.contract.create({
    data: {
      shopId: user.shopId,
      customerPhone,
      customerName,
      deviceBrand,
      deviceModel,
      description: description || null,
      monthlyPrice: parseFloat(monthlyPrice) || 0,
      startDate: start,
      endDate: endDate ? new Date(endDate) : null,
      nextBillingDate,
      notes: notes || null,
      status: "ACTIVE",
    },
  });

  return Response.json(contract, { status: 201 });
}
