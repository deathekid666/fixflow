"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

 if (!res.ok) {
      setError(data.error || "Login failed");
      setLoading(false);
      if (res.status === 403) {
        // Redirect to suspended page after 2 seconds
        setTimeout(() => {
          window.location.href = data.error?.includes("trial")
            ? "/suspended?reason=trial"
            : "/suspended?reason=suspended";
        }, 2000);
      }
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="w-[380px] p-8 bg-slate-900 border border-slate-800 rounded-2xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-white">FixFlow</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Email</label>
            <input
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              placeholder="admin@fixflow.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Password</label>
            <input
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </div>
      <p className="text-center text-xs text-slate-600 mt-6">
        Don't have an account?{" "}
        <a href="/register" className="text-blue-400 hover:text-blue-300">Start free trial</a>
      </p>
    </div>
  );
}