import { prisma } from "@/lib/prisma";

export async function requireApiKey(req: Request): Promise<{ shopId: string } | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const key = auth.slice(7).trim();
  if (!key) return null;

  const apiKey = await prisma.apiKey.findFirst({
    where: { key, isActive: true },
    select: { id: true, shopId: true },
  });

  if (!apiKey) return null;

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsed: new Date() },
  });

  return { shopId: apiKey.shopId };
}
