import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "FixFlow <onboarding@resend.dev>";

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Verify your FixFlow account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f172a; color: #e2e8f0; border-radius: 12px;">
        <h1 style="font-size: 24px; font-weight: bold; color: white; margin-bottom: 8px;">Welcome to FixFlow! 🔧</h1>
        <p style="color: #94a3b8; margin-bottom: 24px;">Hi ${name}, please verify your email to activate your account.</p>
        <a href="${url}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-bottom: 24px;">
          Verify Email →
        </a>
        <p style="color: #64748b; font-size: 12px;">This link expires in 24 hours. If you didn't create a FixFlow account, ignore this email.</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(email: string, name: string, shopName: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Welcome to FixFlow, ${name}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f172a; color: #e2e8f0; border-radius: 12px;">
        <h1 style="font-size: 24px; font-weight: bold; color: white; margin-bottom: 8px;">You're all set! 🎉</h1>
        <p style="color: #94a3b8; margin-bottom: 16px;">Hi ${name}, your shop <strong style="color: white;">${shopName}</strong> is ready. Your 14-day free trial has started.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-bottom: 24px;">
          Go to Dashboard →
        </a>
        <p style="color: #64748b; font-size: 12px;">Need help? Reply to this email or contact support@fixflow.ma</p>
      </div>
    `,
  });
}

export async function sendTrialExpiringEmail(email: string, name: string, daysLeft: number) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Your FixFlow trial expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f172a; color: #e2e8f0; border-radius: 12px;">
        <h1 style="font-size: 24px; font-weight: bold; color: #f59e0b; margin-bottom: 8px;">⏰ Trial ending soon</h1>
        <p style="color: #94a3b8; margin-bottom: 16px;">Hi ${name}, your free trial expires in <strong style="color: white;">${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong>.</p>
        <p style="color: #94a3b8; margin-bottom: 24px;">Upgrade to keep access to all your work orders, customers and data.</p>
        <a href="mailto:support@fixflow.ma" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-bottom: 24px;">
          Contact us to upgrade →
        </a>
        <p style="color: #64748b; font-size: 12px;">Questions? Reply to this email or contact support@fixflow.ma</p>
      </div>
    `,
  });
}