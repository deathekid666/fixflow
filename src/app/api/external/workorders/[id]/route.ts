import { prisma } from "@/lib/prisma";
import { requireApiKey } from "@/lib/requireApiKey";

import { withApiError } from "@/lib/apiError";

export const dynamic = "force-dynamic";

export const GET = withApiError(async (req: Request, { params }: { params: { id: string } }) => {
  const apiKeyData = await requireApiKey(req);
  if (!apiKeyData) return Response.json({ error: "Invalid or missing API key" }, { status: 401 });

  const { shopId } = apiKeyData;

  const order = await prisma.workOrder.findFirst({
    where: { id: params.id, shopId },
    select: {
      id: true, orderNumber: true, status: true,
      customerName: true, customerPhone: true, customerEmail: true,
      deviceBrand: true, deviceModel: true, serialNumber: true, imei: true,
      faultDescription: true, remarks: true, faultLevel: true,
      subtotal: true, total: true, collected: true, discount: true,
      slaDeadline: true, createdAt: true, updatedAt: true,
    },
  });

  if (!order) return Response.json({ error: "Work order not found" }, { status: 404 });

  return Response.json({
    ...order,
    trackingUrl: `https://fixflow-ruddy.vercel.app/track/${order.id}`,
  });
});
