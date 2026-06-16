import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { email, password } = body;

  if (!email || !password) {
    return Response.json({ error: "Email and password required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { shop: true },
  });

  if (!user) return Response.json({ error: "Invalid credentials" }, { status: 401 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return Response.json({ error: "Invalid credentials" }, { status: 401 });

  if (!user.emailVerified && !user.isSuperAdmin) {
    return Response.json({ error: "Please verify your email before logging in. Check your inbox." }, { status: 403 });
  }

  // Check shop status
  if (!user.isSuperAdmin && user.shop) {
    if (user.shop.status === "SUSPENDED") {
      return Response.json({ error: "Your account has been suspended. Please contact support." }, { status: 403 });
    }
    if (user.shop.status === "TRIAL" && user.shop.trialEndsAt) {
      if (new Date() > new Date(user.shop.trialEndsAt)) {
        return Response.json({ error: "Your trial has expired. Please upgrade to continue." }, { status: 403 });
      }
    }
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      shopId: user.shopId,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      shopStatus: user.shop?.status ?? "ACTIVE",
      trialEndsAt: user.shop?.trialEndsAt ?? null,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  cookies().set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  return Response.json({ success: true });
}