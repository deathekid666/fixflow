import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

const DEFAULTS = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  openTime: "09:00",
  closeTime: "18:00",
  isOpen: i >= 1 && i <= 5,
  slotDurationMinutes: 60,
  maxConcurrent: 2,
}));

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.shopId !== params.id && !user.isSuperAdmin)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.shopAvailability.findMany({
    where: { shopId: params.id },
    orderBy: { dayOfWeek: "asc" },
  });

  if (rows.length === 7) return Response.json(rows);

  // Return defaults merged with any existing rows
  const byDay = Object.fromEntries(rows.map(r => [r.dayOfWeek, r]));
  return Response.json(DEFAULTS.map(d => byDay[d.dayOfWeek] ?? { ...d, id: null, shopId: params.id, createdAt: null }));
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  if (user.shopId !== params.id && !user.isSuperAdmin)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Body required" }, { status: 400 });

  const { days, slotDurationMinutes, maxConcurrent } = body as {
    days: { dayOfWeek: number; openTime: string; closeTime: string; isOpen: boolean }[];
    slotDurationMinutes: number;
    maxConcurrent: number;
  };

  await Promise.all(
    days.map(day =>
      prisma.shopAvailability.upsert({
        where: { shopId_dayOfWeek: { shopId: params.id, dayOfWeek: day.dayOfWeek } },
        update: {
          openTime: day.openTime,
          closeTime: day.closeTime,
          isOpen: day.isOpen,
          slotDurationMinutes,
          maxConcurrent,
        },
        create: {
          shopId: params.id,
          dayOfWeek: day.dayOfWeek,
          openTime: day.openTime,
          closeTime: day.closeTime,
          isOpen: day.isOpen,
          slotDurationMinutes,
          maxConcurrent,
        },
      })
    )
  );

  return Response.json({ ok: true });
}
