"use client";
import { useState, useEffect } from "react";

const COOLDOWN = 60;

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function resend() {
    if (!email.trim() || countdown > 0 || status === "sending") return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setStatus("sent");
      setCountdown(COOLDOWN);
    } catch (e: unknown) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">📧</div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            We sent a verification link to your email address. Click the link to activate your account.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-left space-y-2 text-sm text-slate-400">
          <p>✉️ Check your inbox and spam folder</p>
          <p>⏰ The link expires in 24 hours</p>
          <p>🔧 After verifying you can access your dashboard</p>
        </div>

        {/* Resend section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 text-left">
          <p className="text-sm text-slate-300 font-medium">Didn&apos;t receive it?</p>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
            onKeyDown={(e) => e.key === "Enter" && resend()}
            placeholder="Enter your email address"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {status === "sent" && (
            <p className="text-sm text-emerald-400">✓ Verification email sent — check your inbox.</p>
          )}
          {status === "error" && (
            <p className="text-sm text-red-400">{errorMsg}</p>
          )}

          <button
            onClick={resend}
            disabled={!email.trim() || countdown > 0 || status === "sending"}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {status === "sending"
              ? "Sending…"
              : countdown > 0
              ? `Resend in ${countdown}s`
              : "Resend verification email"}
          </button>
        </div>

        <a href="/login" className="inline-block text-xs text-slate-500 hover:text-slate-300 transition-colors">
          ← Back to login
        </a>
      </div>
    </div>
  );
}
