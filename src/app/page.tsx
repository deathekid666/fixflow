"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Wrench, ArrowRight, Check, Zap, Users, BarChart3, Calendar } from "lucide-react";

// ── CountUp ──────────────────────────────────────────────────────────────────
function CountUp({ to, started }: { to: number; started: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let current = 0;
    const duration = 1400;
    const step = 16;
    const increment = to / (duration / step);
    const timer = setInterval(() => {
      current += increment;
      if (current >= to) { setCount(to); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, step);
    return () => clearInterval(timer);
  }, [started, to]);
  return <>{count}</>;
}

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "AI", href: "#ai" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Track Repair", href: "/track" },
];

const FEATURES = [
  {
    span: "col-span-2",
    icon: <Wrench className="w-5 h-5 text-blue-400" />,
    accent: "text-blue-400",
    title: "Work Orders",
    desc: "Create, assign, and track every repair job from intake to delivery. Status updates, notes, parts, and photos — all in one place.",
    preview: (
      <div className="mt-4 rounded-lg border border-white/5 overflow-hidden text-xs">
        <div className="bg-slate-900/60 px-3 py-2 flex items-center gap-2 border-b border-white/5">
          <span className="text-slate-500">Order</span>
          <span className="ml-auto text-slate-500">Customer</span>
          <span className="ml-8 text-slate-500">Status</span>
          <span className="ml-8 text-slate-500">Total</span>
        </div>
        {[
          { num: "#1042", name: "Ahmed K.", model: "iPhone 14 Pro", status: "REPAIRING", color: "text-yellow-400", total: "$89" },
          { num: "#1041", name: "Sofia M.", model: "Samsung S23", status: "DONE", color: "text-green-400", total: "$120" },
          { num: "#1040", name: "Omar B.", model: "MacBook Air", status: "DIAGNOSING", color: "text-blue-400", total: "$240" },
        ].map(r => (
          <div key={r.num} className="flex items-center gap-2 px-3 py-2 border-b border-white/5 last:border-0">
            <span className="text-slate-400 w-12">{r.num}</span>
            <div className="flex-1">
              <div className="text-white font-medium">{r.name}</div>
              <div className="text-slate-500">{r.model}</div>
            </div>
            <span className={`text-xs font-medium ${r.color}`}>{r.status}</span>
            <span className="text-slate-300 w-12 text-right">{r.total}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    span: "col-span-1",
    icon: <Zap className="w-5 h-5 text-purple-400" />,
    accent: "text-purple-400",
    title: "AI Assistant",
    badge: "Only on FixFlow",
    desc: "Diagnose devices, generate repair quotes, and draft customer messages — all powered by Claude AI.",
    preview: (
      <div className="mt-4 space-y-2 text-xs">
        <div className="bg-slate-800/60 rounded-lg px-3 py-2 text-slate-300">iPhone 14 black screen after drop</div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2 text-slate-200 leading-relaxed">
          Likely broken LCD panel. Estimated repair: $80–$120. Timeline: 1–2 hours.
          <div className="mt-2 text-purple-400 text-xs cursor-pointer hover:text-purple-300">→ Draft customer message</div>
        </div>
      </div>
    ),
  },
  {
    span: "col-span-1",
    icon: <BarChart3 className="w-5 h-5 text-blue-400" />,
    accent: "text-blue-400",
    title: "Analytics",
    desc: "Revenue charts, repair volumes, engineer performance, and bounce rates — updated in real time.",
    preview: (
      <div className="mt-4 flex items-end gap-1 h-16">
        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
          <div key={i} className="flex-1 bg-blue-500/20 rounded-sm" style={{ height: `${h}%` }} />
        ))}
      </div>
    ),
  },
  {
    span: "col-span-2",
    icon: <Users className="w-5 h-5 text-blue-400" />,
    accent: "text-blue-400",
    title: "Customer Portal",
    desc: "Customers track their repair live via a public link — no app download needed. Reduces \"where's my phone?\" calls by 80%.",
    preview: (
      <div className="mt-4 space-y-2 text-xs">
        {["Received", "Diagnosing", "Repairing", "Done", "Delivered"].map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${i <= 2 ? "bg-blue-500" : "bg-slate-700"}`} />
            <span className={i <= 2 ? "text-white" : "text-slate-600"}>{s}</span>
            {i === 2 && <span className="ml-auto text-blue-400 font-medium">← Now</span>}
          </div>
        ))}
      </div>
    ),
  },
  {
    span: "col-span-1",
    icon: <Calendar className="w-5 h-5 text-blue-400" />,
    accent: "text-blue-400",
    title: "Appointments",
    desc: "Let customers book online. QR code check-in at the counter. Walk-ins auto-converted to work orders.",
    preview: (
      <div className="mt-4 grid grid-cols-3 gap-1 text-xs">
        {["9:00", "10:00", "11:00", "13:00", "14:00", "15:00"].map((t, i) => (
          <div key={t} className={`px-2 py-1 rounded text-center ${i === 1 || i === 3 ? "bg-blue-600/30 text-blue-300 border border-blue-500/30" : "bg-slate-800/60 text-slate-500"}`}>{t}</div>
        ))}
      </div>
    ),
  },
];

const PRICING_PLANS = [
  {
    name: "Starter",
    price: 29,
    desc: "Perfect for a single-technician shop",
    cta: "Start free trial",
    popular: false,
    features: ["Up to 100 work orders/mo", "Customer portal", "SMS notifications", "Basic analytics", "Email support"],
  },
  {
    name: "Pro",
    price: 59,
    desc: "For growing shops with a team",
    cta: "Start free trial",
    popular: true,
    features: ["Unlimited work orders", "AI repair assistant", "Multi-engineer management", "Advanced analytics", "Appointments & QR check-in", "Priority support"],
  },
  {
    name: "Business",
    price: 99,
    desc: "Multi-branch operations at scale",
    cta: "Contact sales",
    popular: false,
    features: ["Everything in Pro", "Multi-branch dashboard", "Custom branding", "API access", "Dedicated account manager", "SLA guarantee"],
  },
];

const FAQ_ITEMS = [
  { q: "Do I need a credit card to start?", a: "No. Your 14-day free trial starts immediately with no credit card required." },
  { q: "Can I import my existing customer data?", a: "Yes — we support CSV import for customers, work orders, and inventory." },
  { q: "Does it work on mobile?", a: "FixFlow is fully responsive. Technicians can update work orders from their phones." },
  { q: "What languages does the AI support?", a: "The AI assistant supports English, French, and Arabic for customer messages." },
  { q: "How do SMS notifications work?", a: "We integrate with your existing SMS provider (Twilio, etc.) or you can use our built-in service." },
  { q: "Can I cancel anytime?", a: "Yes. No lock-in contracts. Cancel or downgrade at any time from your settings." },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ background: "#0a0f1e", minHeight: "100vh", color: "white" }}>

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-6 border-b border-white/5" style={{ backdropFilter: "blur(12px)", background: "rgba(10,15,30,0.8)" }}>
        <div style={{display:"flex",alignItems:"center",gap:8}} className="mr-10">
          <div style={{width:32,height:32,background:"#2563eb",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Wrench size={16} color="white" />
          </div>
          <span style={{fontWeight:700,fontSize:17,color:"white"}}>FixFlow</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 flex-1">
          {NAV_LINKS.map(l => (
            <Link key={l.label} href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3 ml-auto">
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Sign in</Link>
          <Link href="/register" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded transition-colors">
            Get started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden ml-auto text-slate-400" onClick={() => setMenuOpen(v => !v)}>
          {menuOpen ? "✕" : "☰"}
        </button>

        {menuOpen && (
          <div className="absolute top-14 left-0 right-0 border-b border-white/5 py-4 px-6 flex flex-col gap-4" style={{ background: "#0a0f1e" }}>
            {NAV_LINKS.map(l => (
              <Link key={l.label} href={l.href} className="text-sm text-slate-400 hover:text-white" onClick={() => setMenuOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link href="/login" className="text-sm text-slate-400 hover:text-white">Sign in</Link>
            <Link href="/register" className="text-sm font-semibold text-white bg-blue-600 px-4 py-2 rounded-lg text-center">Get started</Link>
          </div>
        )}
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="flex items-center min-h-screen" style={{ paddingTop: "64px" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-16 w-full grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center py-12 md:py-0">

          {/* Left */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-blue-400 mb-4">
              All-in-One Repair Shop Platform
            </p>

            <h1 className="text-5xl font-bold text-white leading-tight mb-6" style={{ letterSpacing: "-1px" }}>
              Run Your Whole<br />
              Repair Shop From<br />
              One Platform
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
              Work orders, AI diagnostics, customer tracking, inventory, and payments — built for the way repair shops actually run.
            </p>

            <div className="flex gap-4">
              <Link href="/register" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-full transition-colors">
                Start My Free Trial
              </Link>
              <Link href="#pricing" className="border-2 border-white/20 hover:border-white/40 text-white font-semibold px-8 py-3 rounded-full transition-colors">
                See Pricing
              </Link>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <span className="text-yellow-400">★★★★★</span>
              <span className="text-sm text-slate-400">1,000+ repair shops worldwide</span>
            </div>
          </div>

          {/* Right — dashboard mockup */}
          <div>
            <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: "#111827", boxShadow: "0 0 80px rgba(59,130,246,0.18), 0 25px 60px rgba(0,0,0,0.5)" }}>
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5" style={{ background: "#0d1321" }}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                </div>
                <div className="flex-1 mx-4 bg-slate-800/60 rounded px-3 py-1 text-xs text-slate-500 text-center">
                  app.fixflow.io/dashboard
                </div>
              </div>

              {/* App interior */}
              <div className="flex" style={{ minHeight: "320px" }}>
                {/* Sidebar */}
                <div className="w-44 border-r border-white/5 p-3 flex flex-col gap-1" style={{ background: "#0d1321" }}>
                  {[
                    { label: "Dashboard", active: false },
                    { label: "Work Orders", active: true },
                    { label: "Customers", active: false },
                    { label: "Inventory", active: false },
                    { label: "Analytics", active: false },
                    { label: "Appointments", active: false },
                  ].map(item => (
                    <div key={item.label} className={`text-xs px-3 py-2 rounded-md ${item.active ? "bg-blue-600/20 text-blue-400 font-medium" : "text-slate-500"}`}>
                      {item.label}
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="flex-1 p-4">
                  {/* Stats row */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { label: "Revenue (MTD)", value: "$4,820" },
                      { label: "Open Orders", value: "12" },
                      { label: "Completed", value: "38" },
                      { label: "Avg. Repair", value: "$127" },
                    ].map(s => (
                      <div key={s.label} className="rounded-lg border border-white/5 px-3 py-2" style={{ background: "#111827" }}>
                        <div className="text-xs text-slate-500">{s.label}</div>
                        <div className="text-base font-bold text-white">{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Table */}
                  <div className="rounded-lg border border-white/5 overflow-hidden text-xs">
                    <div className="flex gap-2 px-3 py-2 border-b border-white/5 text-slate-600">
                      <span className="w-12">Order</span>
                      <span className="flex-1">Customer</span>
                      <span className="w-20">Status</span>
                      <span className="w-12 text-right">Total</span>
                    </div>
                    {[
                      { num: "#1042", name: "Ahmed K.", model: "iPhone 14 Pro", status: "REPAIRING", color: "text-yellow-400", total: "$89" },
                      { num: "#1041", name: "Sofia M.", model: "Samsung S23", status: "DONE", color: "text-green-400", total: "$120" },
                      { num: "#1040", name: "Omar B.", model: "MacBook Air", status: "DIAGNOSING", color: "text-blue-400", total: "$240" },
                    ].map(r => (
                      <div key={r.num} className="flex items-center gap-2 px-3 py-2 border-b border-white/5 last:border-0">
                        <span className="text-slate-500 w-12">{r.num}</span>
                        <div className="flex-1">
                          <div className="text-slate-200 font-medium">{r.name}</div>
                          <div className="text-slate-600">{r.model}</div>
                        </div>
                        <span className={`w-20 text-xs font-medium ${r.color}`}>{r.status}</span>
                        <span className="text-slate-300 w-12 text-right">{r.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── THIN BAR ───────────────────────────────────────────────────────── */}
      <div className="border-y border-white/5 py-4 text-center text-sm text-slate-500">
        Used by repair shops across Europe, Middle East, and Americas
      </div>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section className="py-24 max-w-6xl mx-auto px-6" id="features">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-white" style={{ letterSpacing: "-1px" }}>Everything your shop needs</h2>
          <p className="text-slate-400 mt-3 text-lg">Built for repair shops. Not adapted from something else.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className={`${f.span} rounded-xl border border-white/7 p-6`}
              style={{ background: "#111827" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center" style={{ background: "#1e293b" }}>
                  {f.icon}
                </div>
                <span className={`text-base font-semibold ${f.accent}`}>{f.title}</span>
                {f.badge && (
                  <span className="ml-2 text-xs bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full px-2 py-0.5">{f.badge}</span>
                )}
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mt-2">{f.desc}</p>
              {f.preview}
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────────────── */}
      <div ref={statsRef} className="border-y border-white/5 py-20">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 122, suffix: "+", label: "Features" },
            { value: 30, suffix: "+", label: "Countries" },
            { value: 0, prefix: "$", label: "Setup cost" },
            { value: 14, suffix: "", label: "Day free trial" },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-5xl font-bold text-white mb-1">
                {s.prefix}{statsVisible ? <CountUp to={s.value} started={statsVisible} /> : 0}{s.suffix}
              </div>
              <div className="text-sm text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PRICING ────────────────────────────────────────────────────────── */}
      <section className="py-24 max-w-4xl mx-auto px-6" id="pricing">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-white" style={{ letterSpacing: "-1px" }}>Simple pricing</h2>
          <p className="text-slate-400 mt-3 text-lg">No hidden fees. Cancel anytime.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PRICING_PLANS.map(plan => (
            <div
              key={plan.name}
              className="rounded-xl p-6 flex flex-col"
              style={{
                background: plan.popular ? "#0f1e3a" : "#111827",
                border: plan.popular ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.07)",
                boxShadow: plan.popular ? "0 0 32px rgba(59,130,246,0.15)" : "none",
              }}
            >
              {plan.popular && (
                <div className="text-xs text-blue-400 font-semibold bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 self-start mb-4">
                  Most Popular
                </div>
              )}
              <div className="text-lg font-bold text-white mb-1">{plan.name}</div>
              <div className="text-4xl font-bold text-white mb-1">${plan.price}<span className="text-lg text-slate-400 font-normal">/mo</span></div>
              <div className="text-sm text-slate-400 mb-6">{plan.desc}</div>

              <Link
                href="/register"
                className={`text-center text-sm font-semibold px-4 py-2.5 rounded-lg mb-6 transition-colors ${
                  plan.popular ? "bg-blue-600 hover:bg-blue-500 text-white" : "border border-slate-700 text-slate-300 hover:border-slate-500"
                }`}
              >
                {plan.cta}
              </Link>

              <ul className="space-y-3 mt-auto">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.popular ? "text-blue-400" : "text-slate-500"}`} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="py-24 max-w-2xl mx-auto px-6" id="faq">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white" style={{ letterSpacing: "-1px" }}>FAQ</h2>
        </div>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="rounded-xl border border-white/7 overflow-hidden" style={{ background: "#111827" }}>
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="text-sm font-medium text-white">{item.q}</span>
                <span className={`text-slate-400 text-lg transition-transform ${openFaq === i ? "rotate-180" : ""}`}>⌄</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-slate-400 leading-relaxed">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────────── */}
      <section className="py-24 text-center border-t border-white/5 px-6">
        <h2 className="text-4xl font-bold text-white mb-3" style={{ letterSpacing: "-1px" }}>Ready to run a better shop?</h2>
        <p className="text-slate-400 text-lg mb-8">14-day free trial. No credit card.</p>
        <Link href="/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-lg transition-all hover:scale-105">
          Start free trial <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
            <Wrench className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-white text-sm">FixFlow</span>
        </div>
        <p className="text-sm text-slate-500">© 2026 FixFlow. Built for repair shops. Made for growth.</p>
      </footer>
    </div>
  );
}
