"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Wrench, CheckCircle2, Zap, Users, BarChart3, Package,
  Calendar, ChevronDown, Menu, X, MessageSquare,
  ClipboardList, CreditCard, Bell, Shield,
} from "lucide-react";

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

// ── Nav links ─────────────────────────────────────────────────────────────────
const NAV = [
  { label: "Features", href: "#features" },
  { label: "AI", href: "#ai" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Track Repairs", href: "/track" },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [typeText, setTypeText] = useState("");
  const [aiVisible, setAiVisible] = useState(false);
  const [countersOn, setCountersOn] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  const QUERY = "iPhone 14 black screen after drop";

  // Typewriter
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      setTypeText(QUERY.slice(0, i + 1));
      i++;
      if (i >= QUERY.length) {
        clearInterval(t);
        setTimeout(() => setAiVisible(true), 600);
      }
    }, 55);
    return () => clearInterval(t);
  }, []);

  // Counter IntersectionObserver
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setCountersOn(true); }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      {/* ── Global styles ────────────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideResponse {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.85)} }

        .fu { animation: fadeUp 0.65s cubic-bezier(.22,1,.36,1) both; }
        .fi { animation: fadeIn 0.5s ease both; }
        .d1 { animation-delay:.08s }
        .d2 { animation-delay:.18s }
        .d3 { animation-delay:.30s }
        .d4 { animation-delay:.44s }
        .d5 { animation-delay:.60s }
        .d6 { animation-delay:.78s }

        .slide-r { animation: slideResponse 0.35s ease both; }
        .cursor  { display:inline-block;width:2px;height:.9em;background:#fff;margin-left:1px;vertical-align:middle;animation:blink 1s step-end infinite; }
        .pulse-d { animation: pulse-dot 2s ease-in-out infinite; }

        .card {
          transition: transform 0.2s cubic-bezier(.22,1,.36,1), box-shadow 0.2s ease;
        }
        .card:hover {
          transform: translateY(-3px);
          box-shadow: 0 24px 48px rgba(0,0,0,.5);
        }

        .hero-grid {
          background-image:
            linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
          background-size: 72px 72px;
        }

        html { scroll-behavior: smooth; }
      `}</style>

      <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

        {/* ════════════════════════════════════════════════════════════════
            NAVBAR
        ════════════════════════════════════════════════════════════════ */}
        <nav className="fixed top-0 inset-x-0 z-50 h-16 flex items-center bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between gap-6">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-8 h-8 bg-emerald-800 rounded-lg flex items-center justify-center">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">FixFlow</span>
            </Link>

            {/* Center links */}
            <div className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
              {NAV.map(({ label, href }) => (
                <a key={label} href={href}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-150 whitespace-nowrap">
                  {label}
                </a>
              ))}
            </div>

            {/* Right */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              <Link href="/login"
                className="text-sm text-gray-700 hover:text-gray-900 border border-gray-300 px-4 py-2 rounded-full transition-colors">
                Sign in
              </Link>
              <Link href="/register"
                className="bg-blue-600 text-white font-semibold text-sm px-5 py-2 rounded-lg hover:bg-blue-700 transition-all duration-150 shadow-sm">
                Free Trial
              </Link>
            </div>

            {/* Mobile toggle */}
            <button onClick={() => setMobileOpen(v => !v)}
              className="md:hidden text-gray-600 hover:text-gray-900 transition-colors -mr-1 p-1">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile drawer */}
          {mobileOpen && (
            <div className="absolute top-16 inset-x-0 bg-white border-b border-gray-100 px-6 py-5 flex flex-col gap-4 md:hidden shadow-md">
              {NAV.map(({ label, href }) => (
                <a key={label} href={href} onClick={() => setMobileOpen(false)}
                  className="text-sm text-gray-700 hover:text-gray-900 transition-colors py-1">
                  {label}
                </a>
              ))}
              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <Link href="/login"
                  className="text-sm text-gray-700 hover:text-gray-900 border border-gray-300 px-4 py-2 rounded-full transition-colors">
                  Sign in
                </Link>
                <Link href="/register"
                  className="bg-blue-600 text-white font-semibold text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-all">
                  Free Trial
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* ════════════════════════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════════════════════════ */}
        <section className="min-h-screen flex flex-col md:flex-row pt-16 overflow-hidden" style={{ backgroundColor: "#1a3a35" }}>

          {/* Left column — 55% */}
          <div className="w-full md:w-[55%] flex items-center px-8 md:pl-20 md:pr-10 py-16 md:py-0">
            <div className="max-w-xl">

              {/* Label */}
              <p className="fu d1 text-xs font-semibold text-green-300 uppercase tracking-widest mb-4">
                All-in-One Repair Shop Management Software
              </p>

              {/* Headline */}
              <h1 className="fu d2 text-4xl md:text-5xl font-bold text-yellow-300 leading-tight mb-6">
                Run Your Whole Repair Shop From One Platform
              </h1>

              {/* Subtext */}
              <p className="fu d3 text-white/80 text-lg mb-8 max-w-lg leading-relaxed">
                Work orders, AI diagnostics, customer tracking, inventory, and payments —
                one platform that replaces WhatsApp and spreadsheets.
              </p>

              {/* CTA buttons */}
              <div className="fu d4 flex flex-wrap gap-4 mb-10">
                <Link href="/register"
                  className="bg-white text-gray-900 font-semibold px-8 py-3 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-md text-sm">
                  Start My Free Trial
                </Link>
                <a href="#pricing"
                  className="border-2 border-white text-white font-semibold px-8 py-3 rounded-full hover:bg-white/10 transition-all duration-200 text-sm">
                  See Pricing
                </a>
              </div>

              {/* Social proof */}
              <div className="fu d5 flex items-center gap-3 flex-wrap">
                <span className="text-yellow-400 text-base tracking-tight">★★★★★</span>
                <span className="text-white/60 text-sm">1000+ reviews on</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-xs bg-white/10 px-2.5 py-1 rounded-md">G2</span>
                  <span className="text-white font-semibold text-xs bg-white/10 px-2.5 py-1 rounded-md">Capterra</span>
                  <span className="text-white font-semibold text-xs bg-white/10 px-2.5 py-1 rounded-md">Trustpilot</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column — 45% */}
          <div className="w-full md:w-[45%] flex items-center justify-center px-8 md:pr-12 py-12 md:py-16">
            <div className="w-full max-w-lg">
              <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: "#d4ede6" }}>

                {/* Browser chrome */}
                <div className="bg-slate-700 px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5 flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-slate-600/60 rounded-md px-4 py-1 text-xs text-slate-300 max-w-xs w-full text-center">
                      app.fixflow.ma/dashboard
                    </div>
                  </div>
                </div>

                {/* App */}
                <div className="bg-slate-900 flex" style={{ minHeight: 380 }}>

                  {/* Sidebar */}
                  <div className="w-40 bg-slate-900 border-r border-white/5 p-3 flex-shrink-0 hidden sm:flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 px-2 py-2 mb-3">
                      <div className="w-6 h-6 bg-emerald-700 rounded-md flex items-center justify-center">
                        <Wrench className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-bold text-white">FixFlow</span>
                    </div>
                    {[
                      { label: "Work Orders", active: true },
                      { label: "Customers" },
                      { label: "Inventory" },
                      { label: "Analytics" },
                      { label: "Appointments" },
                      { label: "Settings" },
                    ].map(item => (
                      <div key={item.label}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          item.active
                            ? "bg-emerald-600/20 text-emerald-400 font-medium"
                            : "text-slate-500 hover:text-slate-300"
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-lg ${item.active ? "bg-emerald-400" : "bg-transparent"}`} />
                        {item.label}
                      </div>
                    ))}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 overflow-hidden">
                    {/* Stat cards */}
                    <div className="grid grid-cols-2 gap-2.5 mb-4">
                      {[
                        { label: "Active Orders", value: "24", delta: "+3 today" },
                        { label: "Revenue (MTD)", value: "$8,420", delta: "+12%" },
                        { label: "Avg Repair Time", value: "2.4h", delta: "−18 min" },
                        { label: "Satisfaction", value: "4.9★", delta: "98%" },
                      ].map(s => (
                        <div key={s.label} className="bg-slate-800/70 rounded-xl p-3 border border-white/5">
                          <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-wide">{s.label}</div>
                          <div className="text-sm font-bold text-white">{s.value}</div>
                          <div className="text-[10px] text-emerald-400 mt-0.5">{s.delta}</div>
                        </div>
                      ))}
                    </div>

                    {/* Table */}
                    <div className="bg-slate-800/50 rounded-xl border border-white/5 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                        <span className="text-xs font-semibold text-white">Recent Work Orders</span>
                        <span className="text-[11px] text-emerald-400">View all →</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs min-w-[320px]">
                          <thead>
                            <tr className="border-b border-white/5">
                              {["Customer", "Device", "Status", "Total"].map(h => (
                                <th key={h} className="text-left px-3 py-2 text-slate-500 font-medium">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { name: "James Carter", device: "iPhone 15 Pro", status: "In Progress", amt: "$289", c: "blue" },
                              { name: "Maria Santos", device: "Samsung S24", status: "Ready", amt: "$95", c: "green" },
                              { name: "Ahmed Al-Rashid", device: "MacBook Air M2", status: "Diagnosed", amt: "$175", c: "yellow" },
                              { name: "Sophie Williams", device: "iPad Pro 12.9", status: "Delivered", amt: "$120", c: "slate" },
                            ].map(r => (
                              <tr key={r.name} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                                <td className="px-3 py-2 text-slate-200">{r.name}</td>
                                <td className="px-3 py-2 text-slate-400">{r.device}</td>
                                <td className="px-3 py-2">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium ${
                                    r.c === "blue"   ? "bg-blue-500/15 text-blue-400" :
                                    r.c === "green"  ? "bg-emerald-500/15 text-emerald-400" :
                                    r.c === "yellow" ? "bg-yellow-500/15 text-yellow-400" :
                                                       "bg-slate-500/15 text-slate-400"
                                  }`}>
                                    <span className={`w-1 h-1 rounded-lg ${
                                      r.c === "blue" ? "bg-blue-400" : r.c === "green" ? "bg-emerald-400" :
                                      r.c === "yellow" ? "bg-yellow-400" : "bg-slate-400"
                                    }`} />
                                    {r.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-white font-semibold">{r.amt}</td>
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
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            MANAGEMENT CONTROL
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Repair Shop Management Control
              </h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                Everything you need to run your repair shop efficiently — all in one platform.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {([
                { icon: ClipboardList, label: "Work Orders", desc: "Track every repair from intake to delivery" },
                { icon: Users, label: "Customer CRM", desc: "Full customer history and communication" },
                { icon: Package, label: "Inventory", desc: "Real-time stock tracking and low-stock alerts" },
                { icon: BarChart3, label: "Analytics", desc: "Revenue insights and performance metrics" },
                { icon: Calendar, label: "Appointments", desc: "Online booking that fills your schedule" },
                { icon: Zap, label: "AI Assistant", desc: "Instant diagnoses and repair suggestions" },
                { icon: CreditCard, label: "Payments", desc: "Invoicing and payment tracking built-in" },
                { icon: Bell, label: "Notifications", desc: "SMS and WhatsApp updates for customers" },
              ] as { icon: React.ElementType; label: string; desc: string }[]).map(({ icon: Icon, label, desc }) => (
                <div key={label}
                  className="flex flex-col items-center text-center p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all duration-200 cursor-default">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-emerald-700" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">{label}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            PROBLEM SECTION
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6 bg-slate-900/40 border-y border-white/5">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Still running your shop on WhatsApp?
              </h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto">
                You&apos;re not alone. Most repair shops lose hours every day to manual work.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  emoji: "🧾",
                  title: "Lost receipts",
                  desc: "Paper receipts disappear. No history means disputes, no warranty tracking, and customers claiming they already paid.",
                },
                {
                  emoji: "💸",
                  title: "Missed payments",
                  desc: "No unified system means repairs go out unpaid. Tracking in WhatsApp threads leaves real money on the table.",
                },
                {
                  emoji: "😤",
                  title: "Angry customers",
                  desc: "\"Is my phone ready?\" — you hear it 10 times a day. You lose 30 minutes just answering status questions.",
                },
              ].map(card => (
                <div key={card.title}
                  className="card bg-slate-900 border border-red-500/10 rounded-2xl p-6 hover:border-red-500/20 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-xl mb-4">
                    {card.emoji}
                  </div>
                  <h3 className="text-white font-semibold text-base mb-2">{card.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            FEATURES BENTO GRID
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6 bg-slate-950" id="features">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-blue-400 text-xs font-semibold uppercase tracking-[0.15em]">Features</span>
              <h2 className="text-3xl md:text-5xl font-bold text-white mt-3">Everything your shop needs</h2>
              <p className="text-slate-400 mt-4 max-w-lg mx-auto">
                One platform to replace every spreadsheet, WhatsApp thread, and paper receipt.
              </p>
            </div>

            <div className="grid grid-cols-12 gap-4">

              {/* Work Orders — large */}
              <div className="col-span-12 md:col-span-8 card bg-slate-900 border border-white/[0.07] rounded-2xl p-7 overflow-hidden">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-widest">Work Orders</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1 mb-1">Every repair, perfectly tracked</h3>
                <p className="text-slate-400 text-sm mb-5">From intake to delivery — photos, notes, payments, warranty — all in one place.</p>
                <div className="bg-slate-800/60 rounded-xl border border-white/5 overflow-hidden">
                  <div className="grid grid-cols-4 px-4 py-2 border-b border-white/5 text-[11px] text-slate-500 font-medium">
                    <span>Customer</span><span>Device</span><span>Status</span><span>Amount</span>
                  </div>
                  {[
                    { name: "James C.", device: "iPhone 15 Pro", status: "In Progress", amt: "$289", dot: "blue" },
                    { name: "Maria S.", device: "Samsung S24", status: "Ready", amt: "$95", dot: "green" },
                    { name: "Ahmed R.", device: "MacBook Air", status: "Diagnosed", amt: "$175", dot: "yellow" },
                  ].map(r => (
                    <div key={r.name} className="grid grid-cols-4 px-4 py-2.5 border-b border-white/[0.04] text-xs hover:bg-white/[0.02] transition-colors last:border-0">
                      <span className="text-slate-200">{r.name}</span>
                      <span className="text-slate-400">{r.device}</span>
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <span className={`w-1.5 h-1.5 rounded-lg flex-shrink-0 ${
                          r.dot === "blue" ? "bg-blue-400" : r.dot === "green" ? "bg-emerald-400" : "bg-yellow-400"
                        }`} />
                        {r.status}
                      </span>
                      <span className="text-white font-semibold">{r.amt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI — small */}
              <div className="col-span-12 md:col-span-4 card bg-slate-900 border border-white/[0.07] rounded-2xl p-7 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse 80% 60% at 80% 20%, rgba(37,99,235,.07), transparent)" }} />
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-widest">AI Assistant</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1 mb-1">Instant repair intelligence</h3>
                <p className="text-slate-400 text-sm mb-5">Diagnose faults, suggest prices, draft messages.</p>
                <div className="space-y-2">
                  <div className="bg-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 border border-white/5">
                    &ldquo;iPhone 14 no display after screen swap&rdquo;
                  </div>
                  <div className="bg-blue-600/15 rounded-xl px-3.5 py-2.5 text-xs text-blue-200 border border-blue-500/20">
                    Likely backlight IC or FPC connector damage. Suggested price: $120–$180.
                  </div>
                </div>
              </div>

              {/* Customer Portal — small */}
              <div className="col-span-12 md:col-span-4 card bg-slate-900 border border-white/[0.07] rounded-2xl p-7">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest">Customer Portal</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1 mb-1">Zero status calls</h3>
                <p className="text-slate-400 text-sm mb-5">Customers track repairs with a live link. No app needed.</p>
                <div className="bg-slate-800 rounded-xl border border-white/5 p-4">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">JC</div>
                    <div>
                      <div className="text-white text-xs font-semibold">WO-2841 · iPhone 15 Pro</div>
                      <div className="text-slate-500 text-[10px]">Screen replacement</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0">
                    {["Received", "Diagnosed", "Repairing", "Ready"].map((step, i) => (
                      <div key={step} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-2.5 h-2.5 rounded-lg border-2 flex-shrink-0 ${
                            i <= 2 ? "border-blue-400 bg-blue-400" : "border-slate-600 bg-transparent"
                          }`} />
                          <span className={`text-[9px] whitespace-nowrap ${i <= 2 ? "text-blue-400" : "text-slate-600"}`}>{step}</span>
                        </div>
                        {i < 3 && <div className={`flex-1 h-px mb-3.5 mx-0.5 ${i < 2 ? "bg-blue-400" : "bg-slate-700"}`} />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Analytics — large */}
              <div className="col-span-12 md:col-span-8 card bg-slate-900 border border-white/[0.07] rounded-2xl p-7 overflow-hidden">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-widest">Analytics</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1 mb-1">Revenue insights at a glance</h3>
                <p className="text-slate-400 text-sm mb-5">Most profitable repairs, busiest days, growth trends — always current.</p>
                <div className="flex items-end gap-1.5 h-28">
                  {[38,58,44,72,50,88,65,82,55,96,70,100].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end h-full">
                      <div className="rounded-t-[3px] transition-all" style={{
                        height: `${h}%`,
                        background: i >= 10
                          ? "linear-gradient(to top, #2563eb, #60a5fa)"
                          : i >= 8
                          ? "rgba(37,99,235,.35)"
                          : "rgba(37,99,235,.2)",
                        minHeight: 4,
                      }} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 mt-2">
                  {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              </div>

              {/* Appointments — medium */}
              <div className="col-span-12 md:col-span-6 card bg-slate-900 border border-white/[0.07] rounded-2xl p-7">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-orange-400" />
                  </div>
                  <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-widest">Appointments</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1 mb-1">Fill your bench, not your voicemail</h3>
                <p className="text-slate-400 text-sm mb-5">Customers book online. You stay focused on repairs.</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { time: "9:00 AM", name: "Maria S.", type: "Battery", open: false },
                    { time: "10:30 AM", name: "Open slot", type: "", open: true },
                    { time: "2:00 PM", name: "Ahmed R.", type: "Screen", open: false },
                  ].map(slot => (
                    <div key={slot.time} className={`rounded-xl p-3 border text-xs ${
                      slot.open
                        ? "border-dashed border-slate-700 bg-transparent"
                        : "bg-slate-800/70 border-white/5"
                    }`}>
                      <div className="text-slate-500 text-[10px] mb-1">{slot.time}</div>
                      <div className={`font-medium ${slot.open ? "text-slate-600" : "text-white"}`}>{slot.name}</div>
                      {slot.type && <div className="text-slate-400 text-[10px] mt-0.5">{slot.type}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Inventory — medium */}
              <div className="col-span-12 md:col-span-6 card bg-slate-900 border border-white/[0.07] rounded-2xl p-7">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/15 flex items-center justify-center">
                    <Package className="w-4 h-4 text-teal-400" />
                  </div>
                  <span className="text-[11px] font-semibold text-teal-400 uppercase tracking-widest">Inventory</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1 mb-1">Never run out of a critical part</h3>
                <p className="text-slate-400 text-sm mb-5">Smart low-stock alerts. Supplier reorders in one click.</p>
                <div className="space-y-3">
                  {[
                    { name: "iPhone 15 Pro Screen", qty: 3, max: 20, warn: true },
                    { name: "Samsung S24 Battery", qty: 12, max: 20, warn: false },
                    { name: "USB-C Charging Port", qty: 28, max: 30, warn: false },
                    { name: "iPhone 14 Battery", qty: 1, max: 20, warn: true },
                  ].map(item => (
                    <div key={item.name} className="flex items-center gap-3 text-xs">
                      <span className="text-slate-300 flex-1 truncate">{item.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-20 h-1.5 bg-slate-800 rounded-lg overflow-hidden">
                          <div className={`h-full rounded-lg transition-all ${item.warn ? "bg-red-400" : "bg-teal-400"}`}
                            style={{ width: `${Math.min(100, (item.qty / item.max) * 100)}%` }} />
                        </div>
                        <span className={`w-5 text-right font-mono tabular-nums ${item.warn ? "text-red-400" : "text-slate-400"}`}>
                          {item.qty}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            AI SECTION
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6 relative overflow-hidden" id="ai">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(37,99,235,.08), transparent 70%)" }} />
          <div className="max-w-4xl mx-auto relative">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs px-4 py-1.5 mb-5">
                <Zap className="w-3 h-3" /> Only on FixFlow
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Meet your AI repair assistant</h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto">
                Describe the issue. Get instant diagnosis, estimated repair cost, and a customer message — in seconds.
              </p>
            </div>

            {/* Chat UI */}
            <div className="bg-slate-900 border border-white/[0.07] rounded-2xl overflow-hidden max-w-2xl mx-auto shadow-2xl shadow-black/50">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5 bg-slate-800/40">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-600/40">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white leading-none">FixFlow AI</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Repair Assistant</div>
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-lg bg-emerald-400 pulse-d" />
                  Online
                </div>
              </div>

              {/* Messages */}
              <div className="p-5 space-y-4 min-h-52">
                {/* User */}
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-xs leading-relaxed">
                    {typeText}
                    {typeText.length < QUERY.length && <span className="cursor" />}
                  </div>
                </div>
                {/* AI */}
                {aiVisible && (
                  <div className="flex gap-3 slide-r">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Zap className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="bg-slate-800 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-200 leading-relaxed">
                        <p className="font-semibold text-white mb-2">Diagnosis: Broken display assembly</p>
                        <ul className="text-slate-300 text-xs space-y-1.5 list-none">
                          <li>• Inspect for backlight damage before ordering a new screen</li>
                          <li>• Test Face ID FPC connector — commonly damaged in drops</li>
                          <li>• Use OEM display to preserve Face ID functionality</li>
                        </ul>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 text-xs text-emerald-400">
                          💰 Suggested price: $180–$240
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 text-xs text-blue-400 cursor-pointer hover:bg-blue-500/15 transition-colors">
                          📱 Draft customer message →
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="px-5 py-4 border-t border-white/5 bg-slate-900/50">
                <div className="bg-slate-800/80 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-500 flex items-center gap-2 cursor-text">
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  Ask anything about a repair...
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            STATS
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-6 border-y border-white/5 bg-slate-950" ref={statsRef}>
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
            {[
              { to: 122, suffix: "+", label: "Features built-in" },
              { to: 30, suffix: "+", label: "Countries" },
              { to: 0, prefix: "$", suffix: "", label: "Setup cost" },
              { to: 14, suffix: "-day", label: "Free trial" },
            ].map(s => (
              <div key={s.label}>
                <div className="text-4xl md:text-5xl font-bold text-white tabular-nums tracking-tight">
                  {s.prefix}<CountUp to={s.to} started={countersOn} />{s.suffix}
                </div>
                <div className="text-slate-500 text-sm mt-2">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            PRICING
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6 bg-slate-950" id="pricing">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-blue-400 text-xs font-semibold uppercase tracking-[0.15em]">Pricing</span>
              <h2 className="text-3xl md:text-5xl font-bold text-white mt-3">Simple, honest pricing</h2>
              <p className="text-slate-400 mt-4">No hidden fees. Cancel anytime. 14-day free trial on all plans.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

              {/* Starter */}
              <div className="card bg-slate-900 border border-white/[0.07] rounded-2xl p-7">
                <div className="text-slate-400 text-sm font-medium mb-3">Starter</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-white tracking-tight">$29</span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>
                <p className="text-slate-500 text-sm mb-7 leading-relaxed">Perfect for solo technicians getting organized.</p>
                <div className="space-y-3 mb-8">
                  {["Up to 100 work orders/mo", "Customer tracking portal", "Basic analytics", "WhatsApp notifications", "Email support"].map(f => (
                    <div key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/register"
                  className="block w-full text-center py-3 rounded-xl border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors">
                  Start free trial
                </Link>
              </div>

              {/* Pro — highlighted */}
              <div className="card relative rounded-2xl p-px" style={{
                background: "linear-gradient(135deg, rgba(37,99,235,.8) 0%, rgba(96,165,250,.4) 50%, rgba(37,99,235,.15) 100%)",
              }}>
                <div className="rounded-2xl p-7 h-full" style={{
                  background: "linear-gradient(160deg, #0f1e3a 0%, #0f172a 60%)",
                }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white text-sm font-medium">Pro</span>
                    <span className="bg-blue-600 text-white text-[11px] px-3 py-1 rounded-lg font-semibold tracking-wide">
                      Most Popular
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-bold text-white tracking-tight">$59</span>
                    <span className="text-slate-400 text-sm">/month</span>
                  </div>
                  <p className="text-slate-400 text-sm mb-7 leading-relaxed">For growing shops that want every feature.</p>
                  <div className="space-y-3 mb-8">
                    {["Unlimited work orders", "AI repair assistant", "Advanced analytics & reports", "Appointment booking", "Inventory management", "Multi-technician support", "Priority support"].map(f => (
                      <div key={f} className="flex items-start gap-2.5 text-sm text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <Link href="/register"
                    className="block w-full text-center py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-500/25">
                    Start free trial
                  </Link>
                </div>
              </div>

              {/* Business */}
              <div className="card bg-slate-900 border border-white/[0.07] rounded-2xl p-7">
                <div className="text-slate-400 text-sm font-medium mb-3">Business</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-white tracking-tight">$99</span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>
                <p className="text-slate-500 text-sm mb-7 leading-relaxed">For multi-location chains and franchises.</p>
                <div className="space-y-3 mb-8">
                  {["Everything in Pro", "Multi-branch management", "White-label customer portal", "API access & webhooks", "Custom integrations", "Dedicated account manager", "SLA & uptime guarantee"].map(f => (
                    <div key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/register"
                  className="block w-full text-center py-3 rounded-xl border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors">
                  Start free trial
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            FAQ
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6 bg-slate-900/30" id="faq">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-14">
              <span className="text-blue-400 text-xs font-semibold uppercase tracking-[0.15em]">FAQ</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mt-3">Frequently asked questions</h2>
            </div>
            <div className="space-y-2">
              {[
                {
                  q: "Do I need a credit card to start?",
                  a: "No. Your 14-day free trial starts immediately with no payment info required. We only ask for a card when you decide to subscribe.",
                },
                {
                  q: "Can I import my existing data?",
                  a: "Yes. FixFlow supports CSV import for customers and work orders. Our onboarding wizard guides you through it in under 10 minutes.",
                },
                {
                  q: "How does the customer tracking portal work?",
                  a: "Each work order gets a unique link sent via WhatsApp or SMS. Customers see real-time status, photos, and pickup info — no app download needed.",
                },
                {
                  q: "Is the AI assistant accurate?",
                  a: "FixFlow AI gives actionable suggestions trained on repair data, not guarantees. Technicians always verify before acting. It's a powerful second opinion.",
                },
                {
                  q: "Can I manage multiple locations?",
                  a: "Yes. The Business plan supports multi-location management. Each branch has its own dashboard with central oversight and consolidated reporting.",
                },
                {
                  q: "What happens when my trial ends?",
                  a: "You'll get a reminder 3 days before. If you don't subscribe, your data is preserved for 30 days so you can export anytime. We never delete without warning.",
                },
              ].map((item, i) => (
                <div key={i} className="border border-white/[0.07] rounded-xl overflow-hidden transition-colors hover:border-white/10">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors">
                    <span className="text-white font-medium text-sm pr-4">{item.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            CTA BANNER
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(37,99,235,.1), transparent 70%)" }} />
          <div className="max-w-2xl mx-auto text-center relative">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Ready to ditch the spreadsheets?
            </h2>
            <p className="text-slate-400 text-lg mb-10">
              Join repair shops across 30+ countries running on FixFlow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register"
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-lg text-base shadow-xl shadow-blue-500/25 transition-all duration-200 hover:scale-105">
                Start free trial — no credit card
              </Link>
              <Link href="/login"
                className="text-slate-300 hover:text-white text-base flex items-center justify-center gap-1.5 transition-colors duration-150">
                Already have an account →
              </Link>
            </div>
            <p className="text-slate-600 text-sm mt-6">No credit card required · Cancel anytime</p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            FOOTER
        ════════════════════════════════════════════════════════════════ */}
        <footer className="border-t border-white/5 py-16 px-6 bg-slate-950">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Wrench className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-bold text-white tracking-tight">FixFlow</span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">
                  The all-in-one repair shop management platform.
                </p>
              </div>
              {[
                { title: "Product", links: ["Features", "AI Assistant", "Pricing", "Changelog"] },
                { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
                { title: "Support", links: ["Documentation", "Track Repair", "Status", "Contact"] },
                { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Security", "Cookies"] },
              ].map(col => (
                <div key={col.title}>
                  <div className="text-white font-semibold text-sm mb-4">{col.title}</div>
                  <div className="space-y-3">
                    {col.links.map(link => (
                      <div key={link}>
                        <a href="#" className="text-slate-500 text-sm hover:text-white transition-colors duration-150">
                          {link}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-slate-600 text-sm">© 2026 FixFlow. All rights reserved.</p>
              <p className="text-slate-700 text-sm">Built for repair shops. Made for growth.</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
