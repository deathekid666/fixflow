import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email, token, password } = await req.json();
  if (!email || !token || !password) return Response.json({ error: "Missing fields" }, { status: 400 });
  if (password.length < 10) return Response.json({ error: "Password must be at least 10 characters" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.resetPasswordToken) return Response.json({ error: "Invalid or expired token" }, { status: 400 });

  const parts = user.resetPasswordToken.split(":");
  if (parts.length !== 2) return Response.json({ error: "Invalid or expired token" }, { status: 400 });
  const [storedToken, expires] = parts;
  const expiresAt = parseInt(expires, 10);
  if (!storedToken || Number.isNaN(expiresAt)) return Response.json({ error: "Invalid or expired token" }, { status: 400 });
  if (storedToken !== token) return Response.json({ error: "Invalid token" }, { status: 400 });
  if (Date.now() > expiresAt) return Response.json({ error: "Token expired" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, resetPasswordToken: null },
  });

  return Response.json({ success: true });
}