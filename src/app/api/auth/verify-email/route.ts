import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return Response.redirect(new URL("/login?error=invalid-token", req.url));
  }

  const user = await prisma.user.findFirst({
    where: { emailVerifyToken: token },
    include: { shop: true },
  });

  if (!user) {
    return Response.redirect(new URL("/login?error=invalid-token", req.url));
  }

  // Mark email as verified
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifyToken: null },
  });

  // Send welcome email
  try {
    const { sendWelcomeEmail } = await import("@/lib/email");
    await sendWelcomeEmail(user.email, user.name, user.shop?.name ?? "Your Shop");
  } catch { /* ignore */ }

  // Auto login
  const jwtToken = jwt.sign(
    {
      id: user.id, role: user.role, shopId: user.shopId,
      email: user.email, isSuperAdmin: user.isSuperAdmin,
      shopStatus: user.shop?.status ?? "TRIAL",
      trialEndsAt: user.shop?.trialEndsAt ?? null,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  cookies().set("token", jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  return Response.redirect(new URL("/dashboard?verified=1", req.url));
}