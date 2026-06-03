import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { shopName, shopPhone, shopAddress, name, email, password } = await req.json();

  if (!shopName || !name || !email || !password) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return Response.json({ error: "Email already registered" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);

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
      role: "ADMIN", shopId: shop.id, isSuperAdmin: false,
    },
  });

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

  return Response.json({ success: true, shopId: shop.id });
}