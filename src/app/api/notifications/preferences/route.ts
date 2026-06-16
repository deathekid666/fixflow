import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

const DEFAULTS = {
  newMessage: true, lowStock: true, newAppointment: true,
  slaBreach: true, orderOverdue: true, certification: true, newRating: true,
};

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const prefs = await prisma.notificationPreference.findUnique({ where: { userId: user.id } });
  return Response.json(prefs ?? { userId: user.id, ...DEFAULTS });
}

export async function PUT(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed = ["newMessage", "lowStock", "newAppointment", "slaBreach", "orderOverdue", "certification", "newRating"];
  const data: Record<string, boolean> = {};
  for (const key of allowed) {
    if (key in body) data[key] = Boolean(body[key]);
  }

  const prefs = await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...DEFAULTS, ...data },
    update: data,
  });

  return Response.json(prefs);
}
