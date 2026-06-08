"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!email) { setError("Email is required"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) setSent(true);
    else { const d = await res.json(); setError(d.error || "Failed"); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">FixFlow</h1>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-5">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-5xl">📧</div>
              <h2 className="text-xl font-bold text-white">Check your email</h2>
              <p className="text-slate-400 text-sm">If an account exists for {email}, we sent a password reset link. Check your inbox and spam folder.</p>
              <Link href="/login" className="block text-sm text-blue-400 hover:text-blue-300">← Back to login</Link>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-bold text-white">Forgot password?</h2>
                <p className="text-slate-400 text-sm mt-1">Enter your email and we'll send you a reset link.</p>
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
                  placeholder="you@example.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
              </div>
              <button onClick={handleSubmit} disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              <Link href="/login" className="block text-center text-xs text-slate-500 hover:text-slate-300">← Back to login</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}