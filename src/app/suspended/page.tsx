"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuspendedContent() {
  const params = useSearchParams();
  const reason = params.get("reason");
  const isTrialExpired = reason === "trial";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">{isTrialExpired ? "⏰" : "🔒"}</div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {isTrialExpired ? "Your trial has expired" : "Account suspended"}
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            {isTrialExpired
              ? "Your 14-day free trial has ended. Upgrade to continue using FixFlow."
              : "Your account has been suspended. Please contact support to resolve this issue."}
          </p>
        </div>
        {isTrialExpired && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 text-left">
            <h2 className="text-sm font-semibold text-white">Upgrade to continue</h2>
            <div className="space-y-2">
              {["Unlimited work orders", "Full team access", "Analytics & reports", "Customer portal", "Priority support"].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-green-400">✓</span> {f}
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-800">
              <p className="text-xs text-slate-500 mb-3">Contact us to upgrade:</p>
              <a href="mailto:support@fixflow.ma" className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                📧 support@fixflow.ma
              </a>
            </div>
          </div>
        )}
        {!isTrialExpired && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-left space-y-2">
            <p className="text-xs text-slate-500">Contact support:</p>
            <a href="mailto:support@fixflow.ma" className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
              📧 support@fixflow.ma
            </a>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <a href="/login" className="px-4 py-2 border border-slate-700 text-slate-300 text-sm rounded-lg hover:bg-slate-800 transition-colors">
            Sign in to another account
          </a>
          <a href="/" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors">
            Back to home
          </a>
        </div>
      </div>
    </div>
  );
}

export default function SuspendedPage() {
  return (
    <Suspense>
      <SuspendedContent />
    </Suspense>
  );
}