import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: {
      role: "ENGINEER",
      ...(user.shopId ? { shopId: user.shopId } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  return Response.json(users);
}