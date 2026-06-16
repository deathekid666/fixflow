import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));

  if (!email || typeof email !== "string") {
    return Response.json({ error: "Email required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  // Return success even if not found to avoid email enumeration
  if (!user || user.emailVerified) {
    return Response.json({ ok: true });
  }

  const token = crypto.randomBytes(32).toString("hex");

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifyToken: token },
  });

  try {
    const { sendVerificationEmail } = await import("@/lib/email");
    await sendVerificationEmail(user.email, user.name, token);
  } catch {
    return Response.json({ error: "Failed to send email" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
