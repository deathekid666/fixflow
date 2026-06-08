import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import bcrypt from "bcrypt";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, currentPassword, newPassword } = await req.json();

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return Response.json({ error: "User not found" }, { status: 404 });

  // If changing password, verify current password
  if (newPassword) {
    if (!currentPassword) return Response.json({ error: "Current password required" }, { status: 400 });
    const valid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!valid) return Response.json({ error: "Current password is incorrect" }, { status: 400 });
    if (newPassword.length < 6) return Response.json({ error: "New password must be at least 6 characters" }, { status: 400 });
  }

  // Check email uniqueness
  if (email && email !== dbUser.email) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return Response.json({ error: "Email already in use" }, { status: 400 });
  }

  const hashed = newPassword ? await bcrypt.hash(newPassword, 10) : undefined;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...(hashed && { password: hashed }),
    },
    select: { id: true, name: true, email: true, role: true },
  });

  return Response.json(updated);
}