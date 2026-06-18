"use client";
import Link from "next/link";
import {
  Wrench, ArrowRight, CheckCircle2, Zap,
  Users, BarChart3, Calendar, Package,
} from "lucide-react";

// ─── Shared token ─────────────────────────────────────────────────────────────
const BG = "#060912";

// ─── Work-orders mock data ────────────────────────────────────────────────────
const ORDERS = [
  { id: "WO-2841", name: "James Carter",   device: "iPhone 15 Pro",  issue: "Screen replacement", status: "In Progress", color: "blue",   amt: "$289" },
  { id: "WO-2840", name: "Maria Santos",   device: "Samsung S24",    issue: "Battery swap",        status: "Ready",       color: "green",  amt: "$95"  },
  { id: "WO-2839", name: "Ahmed Al-Rashid",device: "MacBook Air M2", issue: "Keyboard repair",     status: "Diagnosed",   color: "yellow", amt: "$175" },
  { id: "WO-2838", name: "Sophie Williams",device: "iPad Pro 12.9",  issue: "Charging port",       status: "Delivered",   color: "slate",  amt: "$120" },
];

const STATUS_CLS: Record<string, string> = {
  blue:   "bg-blue-500/15   text-blue-400",
  green:  "bg-emerald-500/15 text-emerald-400",
  yellow: "bg-yellow-500/15  text-yellow-400",
  slate:  "bg-slate-500/15   text-slate-400",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <style>{`
        :root { --bg: ${BG}; }
        html  { scroll-behavior: smooth; background: var(--bg); }
        body  { background: var(--bg); }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        .fu          { animation: fadeUp .65s cubic-bezier(.22,1,.36,1) both; }
        .fu-d1       { animation-delay:.05s; }
        .fu-d2       { animation-delay:.15s; }
        .fu-d3       { animation-delay:.27s; }
        .fu-d4       { animation-delay:.40s; }
        .fu-d5       { animation-delay:.55s; }
        .fu-d6       { animation-delay:.72s; }

        .card-hover  { transition: transform .2s ease, box-shadow .2s ease; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 24px 48px rgba(0,0,0,.55); }

        .pro-glow {
          box-shadow: 0 0 0 1px rgba(59,130,246,.5),
                      0 0 48px rgba(59,130,246,.12);
        }
      `}</style>

      <div style={{ background: BG }} className="min-h-screen text-white antialiased">

        {/* ══════════════════════════════════════════════════════
            NAVBAR
        ══════════════════════════════════════════════════════ */}
        <header className="fixed inset-x-0 top-0 z-50 h-[60px] flex items-center
                           backdrop-blur-xl bg-slate-950/80 border-b border-white/5">
          <div className="max-w-7xl mx-auto w-full px-6 flex items-center">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-[17px] text-white tracking-tight">FixFlow</span>
            </Link>

            {/* Center nav — absolutely centered */}
            <nav className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
              {[
                ["Features",    "#features"],
                ["AI",          "#ai"],
                ["Pricing",     "#pricing"],
                ["FAQ",         "#faq"],
                ["Track Repair","/track"],
              ].map(([label, href]) => (
                <a key={label} href={href}
                   className="text-sm text-slate-400 hover:text-white transition-colors duration-150 whitespace-nowrap">
                  {label}
                </a>
              ))}
            </nav>

            {/* Right */}
            <div className="hidden md:flex items-center gap-4 ml-auto flex-shrink-0">
              <Link href="/login"
                    className="text-sm text-slate-400 hover:text-white transition-colors">
                Sign in
              </Link>
              <Link href="/register"
                    className="bg-white text-slate-900 font-semibold text-sm
                               px-5 py-2 rounded-lg hover:bg-slate-100
                               transition-all duration-150 shadow-sm">
                Get started free
              </Link>
            </div>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════ */}
        <section className="relative min-h-screen flex flex-col items-center
                            justify-center text-center px-6 pt-[60px] pb-16 overflow-hidden">

          {/* Radial glow */}
          <div className="pointer-events-none absolute inset-0"
               style={{
                 background:
                   "radial-gradient(ellipse 80% 55% at 50% 18%, rgba(37,99,235,.18), transparent 70%)",
               }} />

          {/* Announcement pill */}
          <div className="fu fu-d1 inline-flex items-center gap-2 rounded-full
                          border border-blue-500/20 bg-blue-500/10
                          text-blue-400 text-xs px-3 py-1 mb-8">
            NEW &middot; AI Repair Assistant now available
            <ArrowRight className="w-3 h-3" />
          </div>

          {/* Headline */}
          <h1 className="fu fu-d2 font-bold tracking-tight leading-[1.06]"
              style={{ fontSize: "clamp(2.6rem, 6vw, 4.5rem)" }}>
            <span className="text-white block">Stop managing repairs</span>
            <span className="block bg-gradient-to-r from-blue-400 to-violet-400
                             bg-clip-text text-transparent">
              with WhatsApp.
            </span>
          </h1>

          {/* Sub */}
          <p className="fu fu-d3 text-lg text-slate-400 max-w-lg mx-auto mt-5 leading-relaxed">
            Work orders, AI diagnostics, customer tracking, inventory, and
            invoicing — one platform that finally replaces the chaos.
          </p>

          {/* CTA row */}
          <div className="fu fu-d4 flex flex-col sm:flex-row gap-3 justify-center mt-9">
            <Link href="/register"
                  className="inline-flex items-center justify-center gap-2
                             bg-blue-600 hover:bg-blue-500 text-white font-semibold
                             px-8 py-3.5 rounded-xl shadow-xl shadow-blue-500/25
                             hover:scale-105 transition-all duration-200">
              Start free — 14 days
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features"
               className="inline-flex items-center justify-center
                          border border-white/10 bg-white/5 text-slate-300
                          px-6 py-3.5 rounded-xl hover:bg-white/10
                          transition-all duration-200">
              See features
            </a>
          </div>

          {/* Trust line */}
          <div className="fu fu-d5 flex flex-wrap gap-5 justify-center mt-6 text-sm text-slate-500">
            {["No credit card", "Cancel anytime", "14-day free trial"].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                {t}
              </span>
            ))}
          </div>

          {/* Dashboard mockup */}
          <div className="fu fu-d6 max-w-5xl w-full mt-16 relative">
            {/* Glow under mockup */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-24
                            bg-blue-600/10 blur-3xl rounded-full pointer-events-none" />

            <div className="relative rounded-2xl border border-white/[0.08]
                            shadow-2xl shadow-black/60 overflow-hidden bg-slate-900">

              {/* Browser chrome */}
              <div className="flex items-center gap-3 px-4 py-3
                              bg-slate-800/70 border-b border-white/5">
                <div className="flex gap-1.5 flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-slate-700/50 rounded-md px-4 py-1 text-xs
                                  text-slate-400 max-w-[260px] w-full text-center">
                    app.fixflow.io/dashboard
                  </div>
                </div>
              </div>

              {/* App shell */}
              <div className="flex" style={{ minHeight: 380 }}>

                {/* Sidebar */}
                <div className="w-44 border-r border-white/5 p-3 flex-shrink-0 hidden sm:flex flex-col gap-0.5"
                     style={{ background: BG }}>
                  <div className="flex items-center gap-2 px-2 py-2 mb-3">
                    <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
                      <Wrench className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-bold text-white">FixFlow</span>
                  </div>
                  {[
                    { label: "Work Orders", active: true  },
                    { label: "Customers",   active: false },
                    { label: "Inventory",   active: false },
                    { label: "Analytics",   active: false },
                    { label: "Settings",    active: false },
                  ].map(({ label, active }) => (
                    <div key={label}
                         className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs
                           ${active
                             ? "bg-blue-600/15 text-blue-400 font-medium"
                             : "text-slate-500"}`}>
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                        ${active ? "bg-blue-400" : "bg-transparent"}`} />
                      {label}
                    </div>
                  ))}
                </div>

                {/* Content */}
                <div className="flex-1 p-5 overflow-hidden bg-slate-900">

                  {/* Stat cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                    {[
                      { label: "Active Orders",  value: "24",    delta: "+3 today" },
                      { label: "Revenue (MTD)",  value: "$8,420", delta: "+12%"    },
                      { label: "Avg Repair",     value: "2.4h",  delta: "-18 min"  },
                      { label: "Satisfaction",   value: "4.9 / 5", delta: "98%"   },
                    ].map(s => (
                      <div key={s.label}
                           className="rounded-xl p-3 border border-white/5 bg-slate-800/70">
                        <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                          {s.label}
                        </div>
                        <div className="text-sm font-bold text-white">{s.value}</div>
                        <div className="text-[10px] text-emerald-400 mt-0.5">{s.delta}</div>
                      </div>
                    ))}
                  </div>

                  {/* Table */}
                  <div className="rounded-xl border border-white/5 overflow-hidden bg-slate-800/50">
                    <div className="flex items-center justify-between px-4 py-2.5
                                    border-b border-white/5">
                      <span className="text-xs font-semibold text-white">
                        Recent Work Orders
                      </span>
                      <span className="text-[11px] text-blue-400">View all</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[520px]">
                        <thead>
                          <tr className="border-b border-white/5">
                            {["Order", "Customer", "Device", "Issue", "Status", "Total"].map(h => (
                              <th key={h} className="text-left px-4 py-2 text-slate-500 font-medium">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ORDERS.map(r => (
                            <tr key={r.id}
                                className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-2.5 font-mono text-slate-400">{r.id}</td>
                              <td className="px-4 py-2.5 text-slate-200">{r.name}</td>
                              <td className="px-4 py-2.5 text-slate-400">{r.device}</td>
                              <td className="px-4 py-2.5 text-slate-400">{r.issue}</td>
                              <td className="px-4 py-2.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5
                                                  rounded-full text-[10px] font-medium
                                                  ${STATUS_CLS[r.color]}`}>
                                  {r.status}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 font-semibold text-white">{r.amt}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            SOCIAL PROOF BAR
        ══════════════════════════════════════════════════════ */}
        <div className="border-y border-white/5 py-5 text-center"
             style={{ background: BG }}>
          <p className="text-sm text-slate-500">
            Trusted by repair shops in{" "}
            <span className="text-slate-300 font-medium">30+ countries</span>
            {" "}— Europe, MENA, Americas
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════
            FEATURES BENTO GRID
        ══════════════════════════════════════════════════════ */}
        <section className="py-24 max-w-6xl mx-auto px-6" id="features">
          {/* Label + title */}
          <div className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-4">
              Features
            </p>
            <h2 className="text-5xl font-bold tracking-tight text-white">
              One platform. Zero chaos.
            </h2>
            <p className="mt-4 text-slate-400 text-lg max-w-lg mx-auto">
              Everything a repair shop needs — built in, not bolted on.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Work Orders — span 2 */}
            <div className="card-hover md:col-span-2 rounded-2xl border border-white/[0.07]
                            bg-slate-900 p-7 flex flex-col gap-5 overflow-hidden relative"
                 id="ai">
              <div className="absolute inset-0 pointer-events-none"
                   style={{
                     background:
                       "radial-gradient(ellipse 60% 50% at 0% 0%, rgba(37,99,235,.06), transparent 60%)",
                   }} />
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/15
                                flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Work Orders</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Intake to delivery — photos, checklists, parts, payments, and
                  warranty all in one place. Every repair perfectly tracked.
                </p>
              </div>

              {/* Mini table preview */}
              <div className="rounded-xl border border-white/5 overflow-hidden bg-slate-800/50">
                <div className="grid grid-cols-3 px-4 py-2 border-b border-white/5
                                text-[11px] text-slate-500 font-medium">
                  <span>Customer</span><span>Status</span><span className="text-right">Amount</span>
                </div>
                {ORDERS.slice(0, 3).map(r => (
                  <div key={r.id}
                       className="grid grid-cols-3 px-4 py-2.5 border-b border-white/[0.04]
                                  text-xs last:border-0 hover:bg-white/[0.02] transition-colors">
                    <span className="text-slate-200 truncate">{r.name}</span>
                    <span className={`inline-flex self-center items-center gap-1 px-2 py-0.5
                                      rounded-full text-[10px] font-medium w-fit
                                      ${STATUS_CLS[r.color]}`}>
                      {r.status}
                    </span>
                    <span className="text-white font-semibold text-right">{r.amt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Assistant — span 1 */}
            <div className="card-hover md:col-span-1 rounded-2xl border border-purple-500/20
                            p-7 flex flex-col gap-4 relative overflow-hidden"
                 style={{
                   background:
                     "linear-gradient(135deg, rgba(124,58,237,.12) 0%, rgba(37,99,235,.08) 100%)",
                 }}>
              <div className="absolute inset-0 pointer-events-none"
                   style={{
                     background:
                       "radial-gradient(ellipse 80% 60% at 80% 0%, rgba(124,58,237,.1), transparent 70%)",
                   }} />
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20
                                flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-widest
                                 text-purple-400 border border-purple-500/30
                                 rounded-full px-2.5 py-1 bg-purple-500/10">
                  Only on FixFlow
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">AI Assistant</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Describe a fault. Get an instant diagnosis, suggested price,
                  and a customer-ready message.
                </p>
              </div>
              <div className="space-y-2 mt-auto">
                <div className="bg-white/5 border border-white/8 rounded-xl
                                px-3.5 py-2.5 text-xs text-slate-300">
                  &ldquo;iPhone 14 — black screen after drop&rdquo;
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl
                                px-3.5 py-2.5 text-xs text-purple-200">
                  Broken display assembly. Estimated repair: $160–$220.
                </div>
              </div>
            </div>

            {/* Analytics — span 1 */}
            <div className="card-hover md:col-span-1 rounded-2xl border border-white/[0.07]
                            bg-slate-900 p-7 flex flex-col gap-4 overflow-hidden relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15
                              flex items-center justify-center mb-0.5">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Analytics</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Revenue trends, top repair types, technician performance — all in one view.
                </p>
              </div>
              {/* Bar chart */}
              <div className="flex items-end gap-1.5 h-20 mt-auto">
                {[30,55,40,70,50,85,60,90,65,100,72,95].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end h-full">
                    <div className="rounded-t-[2px]"
                         style={{
                           height: `${h}%`,
                           background:
                             i >= 9
                               ? "linear-gradient(to top, #10b981, #34d399)"
                               : "rgba(16,185,129,.2)",
                           minHeight: 3,
                         }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Portal — span 2 */}
            <div className="card-hover md:col-span-2 rounded-2xl border border-white/[0.07]
                            bg-slate-900 p-7 flex flex-col gap-5 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none"
                   style={{
                     background:
                       "radial-gradient(ellipse 50% 60% at 100% 50%, rgba(16,185,129,.05), transparent 60%)",
                   }} />
              <div className="flex items-start gap-5 flex-wrap">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15
                                  flex items-center justify-center mb-4">
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Customer Portal</h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                    Every customer gets a live tracking link. They follow their repair from
                    intake to pickup — without calling you.
                  </p>
                </div>

                {/* Tracking card preview */}
                <div className="flex-1 min-w-[220px] bg-slate-800/60 rounded-xl
                                border border-white/5 p-4">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30
                                    flex items-center justify-center text-xs font-bold text-blue-400">
                      JC
                    </div>
                    <div>
                      <div className="text-white text-xs font-semibold">WO-2841</div>
                      <div className="text-slate-500 text-[10px]">iPhone 15 Pro · Screen replacement</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-px">
                    {["Received","Diagnosed","Repairing","Ready"].map((step, i) => (
                      <div key={step} className="flex items-center flex-1">
                        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                          <div className={`w-2.5 h-2.5 rounded-full border-2
                            ${i <= 2 ? "bg-blue-400 border-blue-400" : "bg-transparent border-slate-600"}`} />
                          <span className={`text-[9px] whitespace-nowrap
                            ${i <= 2 ? "text-blue-400" : "text-slate-600"}`}>
                            {step}
                          </span>
                        </div>
                        {i < 3 && (
                          <div className={`flex-1 h-px mx-1 mb-3.5
                            ${i < 2 ? "bg-blue-400" : "bg-slate-700"}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Extra feature pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Calendar, label: "Appointment booking" },
                  { icon: Package, label: "Inventory alerts" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label}
                       className="flex items-center gap-1.5 text-xs text-slate-400
                                  bg-white/5 border border-white/8 rounded-full px-3 py-1.5">
                    <Icon className="w-3.5 h-3.5 text-slate-500" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            STATS ROW
        ══════════════════════════════════════════════════════ */}
        <div className="border-y border-white/5 py-20 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
            {[
              { value: "122+", label: "Features" },
              { value: "30+",  label: "Countries" },
              { value: "$0",   label: "Setup cost" },
              { value: "14",   label: "Day free trial" },
            ].map(s => (
              <div key={s.label}>
                <div className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                  {s.value}
                </div>
                <div className="text-sm text-slate-500 mt-2">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            PRICING
        ══════════════════════════════════════════════════════ */}
        <section className="py-24 max-w-4xl mx-auto px-6" id="pricing">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-4">
              Pricing
            </p>
            <h2 className="text-5xl font-bold tracking-tight text-white">Simple pricing</h2>
            <p className="mt-4 text-slate-400">No hidden fees. No contracts. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">

            {/* Starter */}
            <div className="card-hover rounded-2xl border border-white/[0.07]
                            bg-slate-900 p-7">
              <div className="text-slate-400 text-sm font-medium mb-3">Starter</div>
              <div className="flex items-baseline gap-1 mb-1.5">
                <span className="text-4xl font-bold text-white tracking-tight">$29</span>
                <span className="text-slate-500 text-sm">/month</span>
              </div>
              <p className="text-slate-500 text-sm mb-7 leading-relaxed">
                Perfect for solo technicians getting started.
              </p>
              <Link href="/register"
                    className="block w-full text-center py-2.5 rounded-xl
                               border border-white/10 text-white text-sm font-medium
                               hover:bg-white/5 transition-colors mb-7">
                Start free trial
              </Link>
              <div className="space-y-3">
                {[
                  "Up to 100 work orders/mo",
                  "Customer tracking portal",
                  "Basic analytics",
                  "WhatsApp notifications",
                  "Email support",
                ].map(f => (
                  <div key={f} className="flex items-start gap-2.5 text-sm text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Pro — highlighted */}
            <div className="card-hover relative rounded-2xl border border-blue-500/40
                            bg-slate-900 p-7 pro-glow"
                 style={{
                   background: "linear-gradient(160deg, #0d1e3f 0%, #0f172a 100%)",
                 }}>
              {/* Most popular badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-blue-600 text-white text-[11px] font-semibold
                                 px-3.5 py-1 rounded-full tracking-wide shadow-lg
                                 shadow-blue-500/30">
                  MOST POPULAR
                </span>
              </div>

              <div className="text-white text-sm font-medium mb-3">Pro</div>
              <div className="flex items-baseline gap-1 mb-1.5">
                <span className="text-4xl font-bold text-white tracking-tight">$59</span>
                <span className="text-slate-400 text-sm">/month</span>
              </div>
              <p className="text-slate-400 text-sm mb-7 leading-relaxed">
                For growing shops that need every feature.
              </p>
              <Link href="/register"
                    className="block w-full text-center py-2.5 rounded-xl
                               bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold
                               transition-colors shadow-lg shadow-blue-500/20 mb-7">
                Start free trial
              </Link>
              <div className="space-y-3">
                {[
                  "Unlimited work orders",
                  "AI repair assistant",
                  "Advanced analytics",
                  "Appointment booking",
                  "Inventory management",
                  "Multi-technician support",
                  "Priority support",
                ].map(f => (
                  <div key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Business */}
            <div className="card-hover rounded-2xl border border-white/[0.07]
                            bg-slate-900 p-7">
              <div className="text-slate-400 text-sm font-medium mb-3">Business</div>
              <div className="flex items-baseline gap-1 mb-1.5">
                <span className="text-4xl font-bold text-white tracking-tight">$99</span>
                <span className="text-slate-500 text-sm">/month</span>
              </div>
              <p className="text-slate-500 text-sm mb-7 leading-relaxed">
                For multi-location chains and franchises.
              </p>
              <Link href="/register"
                    className="block w-full text-center py-2.5 rounded-xl
                               border border-white/10 text-white text-sm font-medium
                               hover:bg-white/5 transition-colors mb-7">
                Start free trial
              </Link>
              <div className="space-y-3">
                {[
                  "Everything in Pro",
                  "Multi-branch management",
                  "White-label portal",
                  "API access & webhooks",
                  "Custom integrations",
                  "Dedicated account manager",
                  "SLA guarantee",
                ].map(f => (
                  <div key={f} className="flex items-start gap-2.5 text-sm text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FINAL CTA
        ══════════════════════════════════════════════════════ */}
        <section className="py-24 px-6 text-center border-t border-white/5 relative overflow-hidden"
                 id="faq">
          <div className="pointer-events-none absolute inset-0"
               style={{
                 background:
                   "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(37,99,235,.1), transparent 70%)",
               }} />
          <div className="relative max-w-xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Ready to run a better shop?
            </h2>
            <p className="text-slate-400 text-lg mb-9">
              14-day free trial. No credit card. Cancel anytime.
            </p>
            <Link href="/register"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500
                             text-white font-semibold px-8 py-4 rounded-xl text-base
                             shadow-xl shadow-blue-500/25 hover:scale-105
                             transition-all duration-200">
              Start free — 14 days
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════════════════ */}
        <footer className="border-t border-white/5 py-10 px-6 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <Wrench className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">FixFlow</span>
          </div>
          <p className="text-sm text-slate-600">
            &copy; 2026 FixFlow. Built for repair shops worldwide.
          </p>
        </footer>

      </div>
    </>
  );
}
