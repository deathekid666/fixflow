import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
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
      emailVerified: false,
      emailVerifyToken: verifyToken,
    },
  });

  // Send verification email
  try {
    const { sendVerificationEmail } = await import("@/lib/email");
    await sendVerificationEmail(email, name, verifyToken);
  } catch (e) {
    console.error("Email send failed:", e);
  }

  return Response.json({ success: true, requiresVerification: true });
}