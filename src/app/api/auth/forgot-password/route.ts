import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return Response.json({ error: "Email required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (!user) return Response.json({ success: true });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetPasswordToken: `${token}:${expires.getTime()}` },
  });

  // Send email if Resend is configured
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await resend.emails.send({
      from: "FixFlow <onboarding@resend.dev>",
      to: email,
      subject: "Reset your FixFlow password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f172a; color: #e2e8f0; border-radius: 12px;">
          <h1 style="font-size: 22px; font-weight: bold; color: white; margin-bottom: 8px;">Reset your password</h1>
          <p style="color: #94a3b8; margin-bottom: 24px;">Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="${url}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-bottom: 24px;">Reset Password →</a>
          <p style="color: #64748b; font-size: 12px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
  } catch { /* ignore if email fails */ }

  return Response.json({ success: true });
}