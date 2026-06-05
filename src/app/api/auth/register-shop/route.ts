import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { shopName, shopPhone, shopAddress, name, email, password } = await req.json();

  if (!shopName || !name || !email || !password) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return Response.json({ error: "Email already registered" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  const verifyToken = randomBytes(32).toString("hex");

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const shop = await prisma.shop.create({
    data: {
      name: shopName,
      phone: shopPhone || null,
      address: shopAddress || null,
      status: "TRIAL",
      plan: "FREE",
      trialEndsAt,
    },
  });

  const user = await prisma.user.create({
    data: {
      name, email, password: hashed,
      role: "ADMIN", shopId: shop.id,
      isSuperAdmin: false,
      emailVerified: true, // Auto verify until domain is ready
      emailVerifyToken: verifyToken,
    },
  });

  // Try to send email but don't block if it fails
  try {
    const { sendVerificationEmail } = await import("@/lib/email");
    await Promise.race([
      sendVerificationEmail(email, name, verifyToken),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
    ]);
  } catch {
    console.log("Email send skipped or timed out");
  }

  const token = jwt.sign(
    {
      id: user.id, role: user.role, shopId: shop.id,
      email: user.email, isSuperAdmin: false,
      shopStatus: "TRIAL", trialEndsAt: shop.trialEndsAt,
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

  return Response.json({ success: true, requiresVerification: false });
}