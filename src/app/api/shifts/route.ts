import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

// GET /api/shifts — list shifts (admin: all shop shifts; engineer: own shifts only)
export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const weekOnly = searchParams.get("week") === "true";

  const whereBase = user.role === "ENGINEER"
    ? { userId: user.id }
    : { shopId: user.shopId ?? undefined };

  const weekFilter = weekOnly
    ? (() => {
        const now = new Date();
        const day = now.getDay(); // 0 = Sun
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - day);
        weekStart.setHours(0, 0, 0, 0);
        return { startTime: { gte: weekStart } };
      })()
    : {};

  const shifts = await prisma.shift.findMany({
    where: { ...whereBase, ...weekFilter },
    include: {
      user: { select: { id: true, name: true, role: true } },
      shop: { select: { id: true, name: true } },
    },
    orderBy: { startTime: "desc" },
    take: 200,
  });

  return Response.json(shifts);
}

// POST /api/shifts — clock in
export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Prevent double clock-in
  const active = await prisma.shift.findFirst({
    where: { userId: user.id, endTime: null },
  });
  if (active) {
    return Response.json({ error: "Already clocked in" }, { status: 400 });
  }

  const { notes } = await req.json().catch(() => ({ notes: undefined }));

  const shift = await prisma.shift.create({
    data: {
      startTime: new Date(),
      userId: user.id,
      shopId: user.shopId ?? null,
      ...(notes ? { notes } : {}),
    },
    include: {
      user: { select: { id: true, name: true, role: true } },
      shop: { select: { id: true, name: true } },
    },
  });

  return Response.json(shift, { status: 201 });
}
