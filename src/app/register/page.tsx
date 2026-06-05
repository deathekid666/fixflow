"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    shopName: "", shopPhone: "", shopAddress: "",
    name: "", email: "", password: "", confirmPassword: "",
  });

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setError("");
    if (!form.shopName || !form.name || !form.email || !form.password) {
      setError("All required fields must be filled."); return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match."); return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/register-shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return; }
    window.location.href = "/verify-email";
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">FixFlow</h1>
          <p className="text-slate-400 text-sm mt-2">Start your free trial — no credit card required</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-500"}`}>{s}</div>
                <span className={`text-xs ${step >= s ? "text-slate-300" : "text-slate-600"}`}>{s === 1 ? "Shop Info" : "Your Account"}</span>
                {s < 2 && <div className={`flex-1 h-px ${step > s ? "bg-blue-600" : "bg-slate-800"}`} />}
              </div>
            ))}
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Tell us about your shop</h2>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Shop Name *</label>
                <input placeholder="e.g. TechFix Casablanca" value={form.shopName} onChange={e => set("shopName", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Phone</label>
                <input placeholder="+212..." value={form.shopPhone} onChange={e => set("shopPhone", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Address</label>
                <input placeholder="Shop address" value={form.shopAddress} onChange={e => set("shopAddress", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
              </div>
              <button onClick={() => { if (!form.shopName) { setError("Shop name is required"); return; } setError(""); setStep(2); }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
                Next →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Create your account</h2>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Your Name *</label>
                <input placeholder="Full name" value={form.name} onChange={e => set("name", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email *</label>
                <input type="email" placeholder="you@example.com" value={form.email} onChange={e => set("email", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Password *</label>
                <input type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => set("password", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Confirm Password *</label>
                <input type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setError(""); setStep(1); }}
                  className="px-4 py-2.5 border border-slate-700 text-slate-300 text-sm rounded-lg hover:bg-slate-800 transition-colors">
                  ← Back
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {loading ? "Creating account..." : "Start Free Trial"}
                </button>
              </div>
            </div>
          )}

          <div className="bg-slate-800/50 rounded-lg px-4 py-3 text-xs text-slate-500 space-y-1">
            <p>✅ 14-day free trial</p>
            <p>✅ No credit card required</p>
            <p>✅ Full access to all features</p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}