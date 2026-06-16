import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { sendNotification, type SmsProvider } from "@/lib/smsService";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || user.role !== "ADMIN" || user.shopId !== params.id)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { phone } = await req.json();
  if (!phone) return Response.json({ error: "Phone number required" }, { status: 400 });

  const settings = await prisma.shopSettings.findUnique({ where: { shopId: params.id } });
  const provider = (settings?.smsProvider ?? "mock") as SmsProvider;

  const shop = await prisma.shop.findUnique({ where: { id: params.id }, select: { name: true } });

  const message = `✅ Test message from ${shop?.name ?? "FixFlow"}! Your SMS notifications are working correctly.`;
  const result = await sendNotification(phone, message, provider);

  return Response.json(result);
}
