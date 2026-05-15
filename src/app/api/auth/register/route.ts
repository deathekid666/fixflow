import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = requireAuth(req);

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, name, password } = await req.json();

  if (!email || !password || !name) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });

  if (exists) {
    return Response.json({ error: "User already exists" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
      role: "ENGINEER",
      shopId: user.shopId,
    },
  });

  return Response.json({ id: newUser.id, name: newUser.name, email: newUser.email });
}