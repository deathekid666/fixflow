"use client";

import { useState } from "react";
import Link from "next/link";

const PLANS = [
  {
    key: "FREE",
    name: "Starter",
    price: 0,
    period: "forever",
    tagline: "Perfect for getting started",
    badge: null,
    highlight: false,
    features: [
      { text: "Up to 50 work orders/month", included: true },
      { text: "1 user account", included: true },
      { text: "Customer tracking portal", included: true },
      { text: "WhatsApp notifications", included: true },
      { text: "PDF reports & invoices", included: true },
      { text: "Basic analytics", included: true },
      { text: "Multi-user access", included: false },
      { text: "Email notifications", included: false },
      { text: "Multi-branch support", included: false },
      { text: "IMEI blacklist checks", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    key: "PRO",
    name: "Pro",
    price: 29,
    period: "month",
    tagline: "For growing repair shops",
    badge: "Most Popular",
    highlight: true,
    features: [
      { text: "Unlimited work orders", included: true },
      { text: "Up to 10 users", included: true },
      { text: "Customer tracking portal", included: true },
      { text: "WhatsApp & SMS notifications", included: true },
      { text: "Email notifications (Resend)", included: true },
      { text: "Advanced analytics & reports", included: true },
      { text: "Multi-branch support (3 locations)", included: true },
      { text: "IMEI blacklist checks", included: true },
      { text: "API access for integrations", included: true },
      { text: "Priority support", included: true },
      { text: "White-label option", included: false },
    ],
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise",
    price: 79,
    period: "month",
    tagline: "For large repair chains",
    badge: null,
    highlight: false,
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Unlimited users & branches", included: true },
      { text: "Custom domain email", included: true },
      { text: "Dedicated support manager", included: true },
      { text: "Custom integrations", included: true },
      { text: "White-label option", included: true },
      { text: "SLA guarantee (99.9% uptime)", included: true },
      { text: "On-boarding assistance", included: true },
      { text: "Advanced security & audit logs", included: true },
      { text: "Multi-currency + multi-tax", included: true },
      { text: "Custom analytics dashboards", included: true },
    ],
  },
] as const;

const FAQ = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes — you can upgrade or downgrade your plan at any time. Upgrades take effect immediately, downgrades at the next billing cycle.",
  },
  {
    q: "Is there a free trial?",
    a: "All new shops start on a 14-day trial with full Pro features unlocked, no credit card required.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards via Stripe. Bank transfers available for Enterprise.",
  },
  {
    q: "What happens when I hit the 50 order limit on Starter?",
    a: "You'll see a warning at 40 orders. At 50 you can still view existing orders but creating new ones requires upgrading.",
  },
  {
    q: "Do you offer discounts for annual billing?",
    a: "Yes — pay annually and get 2 months free (equivalent to ~17% off). Contact us to switch to annual billing.",
  },
];

export default function PricingPage() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function handleCta(planKey: string) {
    if (planKey === "FREE") return;
    if (planKey === "ENTERPRISE") {
      window.location.href = "mailto:hello@fixflow.ma?subject=Enterprise Plan Enquiry";
      return;
    }
    setSelectedPlan(planKey);
    setShowUpgradeModal(true);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="text-lg font-bold text-white">FixFlow</Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Log in</Link>
          <Link href="/register" className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium">Start free trial</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="text-center py-20 px-6">
        <div className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-400 bg-blue-400/10 border border-blue-400/20 px-3 py-1 rounded-full mb-6">
          Simple, Transparent Pricing
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
          Plans that grow<br className="hidden sm:block"/> with your shop
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Start free, upgrade when you need more. No hidden fees. Cancel anytime.
        </p>
      </div>

      {/* Plans */}
      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map(plan => (
            <div key={plan.key}
              className={`relative rounded-2xl border p-6 flex flex-col gap-6 ${
                plan.highlight
                  ? "bg-blue-600 border-blue-500 shadow-2xl shadow-blue-500/20 scale-105"
                  : "bg-slate-900 border-slate-800"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-widest bg-amber-400 text-amber-900 px-3 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}
              <div>
                <p className={`text-sm font-semibold mb-1 ${plan.highlight ? "text-blue-100" : "text-slate-400"}`}>{plan.name}</p>
                <div className="flex items-end gap-1 mb-1">
                  {plan.price === 0 ? (
                    <span className="text-4xl font-bold">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className={`text-sm mb-1.5 ${plan.highlight ? "text-blue-200" : "text-slate-400"}`}>/mo</span>
                    </>
                  )}
                </div>
                <p className={`text-sm ${plan.highlight ? "text-blue-100" : "text-slate-400"}`}>{plan.tagline}</p>
              </div>

              <button
                onClick={() => handleCta(plan.key)}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-white text-blue-600 hover:bg-blue-50"
                    : plan.key === "FREE"
                    ? "bg-slate-800 text-slate-300 cursor-default"
                    : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                }`}
              >
                {plan.key === "FREE" ? "Get Started Free" : plan.key === "ENTERPRISE" ? "Contact Sales" : `Upgrade to ${plan.name}`}
              </button>

              <ul className="space-y-3">
                {plan.features.map((f, i) => (
                  <li key={i} className={`flex items-start gap-2.5 text-sm ${f.included ? (plan.highlight ? "text-blue-100" : "text-slate-300") : "text-slate-600 line-through"}`}>
                    <span className={`mt-0.5 flex-shrink-0 text-base ${f.included ? (plan.highlight ? "text-white" : "text-green-400") : "text-slate-700"}`}>
                      {f.included ? "✓" : "✗"}
                    </span>
                    {f.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="text-center mt-12 text-sm text-slate-500">
          <p>Trusted by 500+ repair shops · 14-day free trial · No credit card required</p>
        </div>

        {/* Feature comparison callout */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: "🔒", label: "SSL encrypted", sub: "All data secured" },
            { icon: "🌍", label: "Multi-currency", sub: "MAD, EUR, USD, GBP" },
            { icon: "📱", label: "Mobile-ready", sub: "Works on any device" },
            { icon: "🆘", label: "Support included", sub: "Email & WhatsApp" },
          ].map(f => (
            <div key={f.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">{f.icon}</div>
              <p className="text-sm font-semibold text-white">{f.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{f.sub}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3 max-w-2xl mx-auto">
            {FAQ.map((faq, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-white">{faq.q}</span>
                  <span className={`text-slate-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`}>▾</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-slate-400 leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA banner */}
        <div className="mt-20 bg-blue-600 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Ready to streamline your repairs?</h2>
          <p className="text-blue-100 mb-6">Start your free 14-day trial today. No credit card required.</p>
          <Link href="/register" className="inline-block px-8 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors">
            Start Free Trial →
          </Link>
        </div>
      </div>

      {/* "Coming soon" modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-white mb-2">Payments Launching Soon</h3>
            <p className="text-slate-400 text-sm mb-2">
              You&apos;ve selected the <strong className="text-white">{selectedPlan}</strong> plan.
              We&apos;ve saved your choice and will reach out when billing goes live.
            </p>
            <p className="text-slate-500 text-xs mb-6">
              In the meantime, continue using FixFlow with your current plan.
              You&apos;ll be among the first to upgrade when Stripe payments launch.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-2.5 border border-slate-700 text-slate-300 rounded-xl text-sm hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              <a href={`mailto:hello@fixflow.ma?subject=I want to upgrade to ${selectedPlan}&body=Shop name: %0D%0AEmail: `}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Notify Me
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
