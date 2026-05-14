import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shopFilter = user.shopId ? { shopId: user.shopId } : {};

  const [totalTickets, openTickets, inProgressTickets, doneTickets] =
    await Promise.all([
      prisma.ticket.count({ where: shopFilter }),
      prisma.ticket.count({ where: { ...shopFilter, status: "OPEN" } }),
      prisma.ticket.count({ where: { ...shopFilter, status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { ...shopFilter, status: "DONE" } }),
    ]);

  return Response.json({
    totalTickets,
    openTickets,
    inProgressTickets,
    doneTickets,
  });
}