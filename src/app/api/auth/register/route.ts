import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email, name, password } =
    await req.json();

  if (!email || !password || !name) {
    return Response.json(
      { error: "Missing fields" },
      { status: 400 }
    );
  }

  const exists =
    await prisma.user.findUnique({
      where: { email },
    });

  if (exists) {
    return Response.json(
      { error: "User already exists" },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(
    password,
    10
  );

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
      role: "ENGINEER",
    },
  });

  return Response.json(user);
}