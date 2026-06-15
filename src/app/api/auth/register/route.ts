import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import bcrypt from "bcrypt";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { email, name, password, role } = await req.json();

  if (!email || !password || !name) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return Response.json({ error: "An account with this email already exists" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);

  const created = await prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
      role: role ?? "ENGINEER",
      shopId: user.shopId ?? null,
    },
  });

  return Response.json({ id: created.id, name: created.name, email: created.email, role: created.role });
}