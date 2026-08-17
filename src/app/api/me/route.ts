import { requireAuth } from "@/lib/requireAuth";
import { prisma } from "@/lib/prisma";

import { withApiError } from "@/lib/apiError";

export const dynamic = "force-dynamic";

export const GET = withApiError(async (req: Request) => {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      shopId: true,
      isSuperAdmin: true,
      shop: {
        select: {
          id: true,
          name: true,
          onboardingComplete: true,
          currency: true,
          certification: true,
        }
      }
    },
  });

  return Response.json(dbUser);
});