// src/app/api/shifts/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

// PATCH /api/shifts/[id] — clock out
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const shift = await prisma.shift.findUnique({ where: { id: params.id } });
  if (!shift) return Response.json({ error: "Not found" }, { status: 404 });

  // Only the shift owner or an admin can clock out
  if (shift.userId !== user.id && user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (shift.endTime) {
    return Response.json({ error: "Shift already ended" }, { status: 400 });
  }

  const { notes } = await req.json().catch(() => ({ notes: undefined }));

  const updated = await prisma.shift.update({
    where: { id: params.id },
    data: {
      endTime: new Date(),
      ...(notes !== undefined ? { notes } : {}),
    },
    include: {
      user: { select: { id: true, name: true } },
      shop: { select: { id: true, name: true } },
    },
  });

  return Response.json(updated);
}

// DELETE /api/shifts/[id] — admin only
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  await prisma.shift.delete({ where: { id: params.id } });
  return Response.json({ message: "Deleted" });
}
