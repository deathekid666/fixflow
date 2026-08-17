"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Wrench, ArrowRight, Play, Check, Star, Zap, BarChart3, Users, Calendar } from "lucide-react";

const NAV_LINKS = ["Features", "AI", "Pricing", "FAQ"];

const COUNTRIES = [
  "🇬🇧 United Kingdom",
  "🇫🇷 France",
  "🇩🇪 Germany",
  "🇸🇦 Saudi Arabia",
  "🇲🇦 Morocco",
  "🇺🇸 United States",
  "🇦🇪 UAE",
];

const PROBLEMS = [
  { icon: "😤", title: "Lost repair history", body: "Customer brings back a phone. You have no record of what was done or who did it." },
  { icon: "💸", title: "Missed payments", body: "Someone owes money. No system to track it. You realize 3 months later." },
  { icon: "📱", title: "Customers calling nonstop", body: "They want updates. You're repairing. WhatsApp is chaos. Customers get angry." },
];

const COMPARISON_ROWS = [
  { label: "AI Repair Assistant", fixflow: "✓", rd: "✗", rs: "✗", fb: "✗" },
  { label: "Arabic + French support", fixflow: "✓", rd: "✗", rs: "✗", fb: "✗" },
  { label: "Customer chat messaging", fixflow: "✓", rd: "✗", rs: "✗", fb: "✗" },
  { label: "Industry benchmarking", fixflow: "✓", rd: "✗", rs: "✗", fb: "✗" },
  { label: "Starting price/month", fixflow: "$29", rd: "$75", rs: "$50", fb: "$99" },
  { label: "Free trial", fixflow: "14 days", rd: "14 days", rs: "14 days", fb: "14 days" },
];

const STATS = [
  { value: "122+", label: "Features" },
  { value: "30+", label: "Countries" },
  { value: "$0", label: "Setup" },
  { value: "14", label: "Day trial" },
];

const PLANS = [
  {
    name: "Starter",
    price: "$29",
    desc: "For solo shops just getting started.",
    popular: false,
    features: ["50 work orders/month", "3 engineers", "Customer portal", "Basic analytics"],
  },
  {
    name: "Pro",
    price: "$59",
    desc: "For growing shops that need it all.",
    popular: true,
    features: ["Unlimited work orders", "Unlimited engineers", "AI Repair Assistant", "Advanced analytics", "Commission tracking", "Priority support"],
  },
  {
    name: "Business",
    price: "$99",
    desc: "For multi-branch repair operations.",
    popular: false,
    features: ["Everything in Pro", "Multiple branches", "White label", "API access", "Dedicated support"],
  },
];

const FOOTER_LINKS = ["Features", "Pricing", "FAQ", "Track Repair", "Privacy", "Terms"];

const TABLE_ROWS: { order: string; customer: string; device: string; status: string; bg: string; color: string }[] = [
  { order: "#1042", customer: "Ahmed K.", device: "iPhone 14 Pro", status: "REPAIRING", bg: "bg-orange-500/15", color: "text-orange-400" },
  { order: "#1041", customer: "Sara M.", device: "Samsung S23", status: "DONE", bg: "bg-green-500/15", color: "text-green-400" },
  { order: "#1040", customer: "Omar B.", device: "MacBook Air", status: "DIAGNOSING", bg: "bg-yellow-500/15", color: "text-yellow-400" },
  { order: "#1039", customer: "Nadia R.", device: "iPhone 13", status: "DELIVERED", bg: "bg-slate-500/15", color: "text-slate-400" },
];

export default function LandingPage() {
  // Scroll-reveal animations
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("revealed");
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="bg-[#050914] text-white min-h-screen" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .anim-blob1 { animation: blob 8s infinite; }
        .anim-blob2 { animation: blob 10s infinite 2s; }
        .anim-blob3 { animation: blob 12s infinite 4s; }
        .anim-float { animation: float 6s ease-in-out infinite; }
        .pulse-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
        .reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.7s ease-out, transform 0.7s ease-out; }
        .reveal.revealed { opacity: 1; transform: translateY(0); }
        .hover-card { transition: all 0.2s ease; }
        .hover-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.1); }
      `}</style>

      {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 backdrop-blur-xl bg-[#050914]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between relative">
          <div className="flex items-center gap-2">
            <div className="w-[30px] h-[30px] bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Wrench size={14} color="white" />
            </div>
            <span className="font-bold text-white text-base">FixFlow</span>
          </div>

          <div className="hidden md:flex" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", gap: 32, alignItems: "center" }}>
            {NAV_LINKS.map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="text-sm text-white/40 hover:text-white transition-colors no-underline">
                {l}
              </a>
            ))}
            <a href="/track" className="text-sm text-white/40 hover:text-white transition-colors no-underline">Track Repair</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-white/40 hover:text-white transition-colors no-underline">Sign in</Link>
            <Link href="/register" className="text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition-colors no-underline">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-screen flex items-center pt-14">
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div className="anim-blob1" style={{ position: "absolute", top: "25%", left: "25%", width: 384, height: 384, borderRadius: "50%", background: "rgba(37,99,235,0.08)", filter: "blur(64px)" }} />
          <div className="anim-blob2" style={{ position: "absolute", top: "33%", right: "25%", width: 320, height: 320, borderRadius: "50%", background: "rgba(124,58,237,0.06)", filter: "blur(64px)" }} />
          <div className="anim-blob3" style={{ position: "absolute", bottom: "25%", left: "33%", width: 288, height: 288, borderRadius: "50%", background: "rgba(96,165,250,0.05)", filter: "blur(64px)" }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full relative">
          {/* Left column */}
          <div>
            <div className="inline-flex items-center gap-2 border border-blue-500/20 bg-blue-500/8 rounded-full px-3 py-1 text-xs text-blue-400 mb-6">
              <span className="pulse-dot w-1.5 h-1.5 bg-blue-400 rounded-full inline-block" />
              AI-Powered · Now available
            </div>

            <h1 className="text-white mb-5" style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05, letterSpacing: "-3px" }}>
              <span style={{ display: "block" }}>The repair shop</span>
              <span style={{ display: "block" }}>OS for <span className="text-blue-400">2026</span>.</span>
            </h1>

            <p className="text-lg text-white/40 leading-relaxed mb-8" style={{ maxWidth: 420 }}>
              Replace WhatsApp groups and paper receipts with one AI-powered platform. Work orders, inventory, payments, and customer chat — built for repair professionals.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <Link href="/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 no-underline" style={{ boxShadow: "0 10px 30px rgba(59,130,246,0.2)" }}>
                Start free trial <ArrowRight size={14} />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 border border-white/10 hover:border-white/20 text-white/60 hover:text-white text-sm px-5 py-3 rounded-xl transition-all no-underline">
                Watch demo <Play size={14} />
              </a>
            </div>

            <div className="flex flex-wrap gap-6 text-xs text-white/30 mb-8">
              {["No credit card", "Cancel anytime", "14-day free trial"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check size={11} className="text-green-500" /> {t}
                </span>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 flex items-center gap-3">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={12} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm text-white/40">
                Trusted by <span className="text-white font-medium">1,200+</span> repair shops
              </span>
            </div>
          </div>

          {/* Right column — dashboard mockup */}
          <div className="anim-float">
            <div className="rounded-2xl overflow-hidden border border-white/8" style={{ background: "#0d1117", boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 80px rgba(37,99,235,0.07)" }}>
              {/* Browser bar */}
              <div className="h-9 flex items-center px-3 gap-2 border-b border-white/5" style={{ background: "#161b22" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57", display: "inline-block" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e", display: "inline-block" }} />
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840", display: "inline-block" }} />
                <span className="flex-1 text-center text-xs text-white/20" style={{ fontFamily: "monospace" }}>app.fixflow.io/dashboard</span>
              </div>

              {/* Dashboard body */}
              <div className="flex" style={{ height: 380 }}>
                {/* Sidebar */}
                <div className="w-40 border-r border-white/5 p-3 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-4 px-2">
                    <Wrench size={12} className="text-blue-400" />
                    <span className="text-xs font-semibold text-white">FixFlow</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs mb-0.5 bg-blue-500/15 text-blue-400">
                    <Wrench size={11} /> Work Orders
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs mb-0.5 text-white/25">
                    <Users size={11} /> Customers
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs mb-0.5 text-white/25">
                    <Zap size={11} /> Parts
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs mb-0.5 text-white/25">
                    <BarChart3 size={11} /> Analytics
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs mb-0.5 text-white/25">
                    <Calendar size={11} /> Appointments
                  </div>
                </div>

                {/* Main */}
                <div className="flex-1 p-4 min-w-0">
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                      { label: "Revenue", value: "$8,420", color: "text-green-400" },
                      { label: "Active", value: "24", color: "text-blue-400" },
                      { label: "Done", value: "38", color: "text-violet-400" },
                      { label: "Rating", value: "4.9★", color: "text-yellow-400" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg p-2.5 bg-white/3 border border-white/5">
                        <div className="text-[10px] text-white/30 mb-1">{s.label}</div>
                        <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-white/5 overflow-hidden">
                    <div className="grid px-3 py-1.5 text-[10px] text-white/20 border-b border-white/5" style={{ gridTemplateColumns: "70px 1fr 110px 85px" }}>
                      <span>ORDER</span><span>CUSTOMER</span><span>DEVICE</span><span>STATUS</span>
                    </div>
                    {TABLE_ROWS.map((r) => (
                      <div key={r.order} className="grid px-3 py-2 text-xs border-b border-white/3 items-center" style={{ gridTemplateColumns: "70px 1fr 110px 85px" }}>
                        <span className="text-white/25" style={{ fontFamily: "monospace" }}>{r.order}</span>
                        <span className="font-medium truncate">{r.customer}</span>
                        <span className="text-white/40 truncate">{r.device}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.bg} ${r.color}`} style={{ width: "fit-content" }}>{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF TICKER ───────────────────────────────────────── */}
      <section className="border-y border-white/5 py-4 overflow-hidden">
        <p className="text-center text-xs text-white/20 uppercase tracking-widest">Trusted by repair shops across</p>
        <div className="flex flex-wrap justify-center gap-8 mt-2 text-sm text-white/30 font-medium">
          {COUNTRIES.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      </section>

      {/* ── PROBLEM ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center mb-14">
          <h2 className="text-4xl font-bold tracking-tight text-white mb-4">Still running your shop on WhatsApp?</h2>
          <p className="text-lg text-white/40">Repair shops lose 2+ hours every day to tools that weren't built for them.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {PROBLEMS.map((p) => (
            <div key={p.title} className="reveal hover-card p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="text-2xl mb-3">{p.icon}</div>
              <h3 className="text-base font-semibold mb-2">{p.title}</h3>
              <p className="text-sm text-white/40">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs text-blue-400 font-semibold tracking-widest uppercase block mb-3">Features</span>
            <h2 className="text-5xl font-bold tracking-tight text-white mb-4">One platform. Zero chaos.</h2>
            <p className="text-lg text-white/40 max-w-md mx-auto">Replace scattered tools with one system built specifically for repair shops.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="reveal hover-card md:col-span-2 p-8 rounded-2xl border border-white/5 bg-white/[0.02] relative overflow-hidden">
              <div style={{ position: "absolute", top: -80, right: -80, width: 240, height: 240, borderRadius: "50%", background: "rgba(59,130,246,0.05)", filter: "blur(64px)" }} />
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center mb-5 relative"><Wrench size={20} className="text-blue-400" /></div>
              <h3 className="text-xl font-bold mb-3 tracking-tight relative">Smart work orders</h3>
              <p className="text-sm text-white/40 leading-relaxed relative">Complete lifecycle from intake to delivery. Photos, diagnosis checklist, parts, customer chat, payments, repair timer, and SLA tracking — everything in one place.</p>
            </div>

            <div className="reveal hover-card md:col-span-1 p-8 rounded-2xl border border-violet-500/15 relative" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.05))" }}>
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center mb-5"><Zap size={20} className="text-violet-400" /></div>
              <h3 className="text-xl font-bold mb-3 tracking-tight">AI assistant</h3>
              <p className="text-sm text-white/40 leading-relaxed mb-4">Describe the fault. Get repair steps, parts list, and price suggestion in seconds.</p>
              <span className="text-[11px] font-semibold text-violet-400 bg-violet-500/15 px-3 py-1 rounded-full">Only on FixFlow</span>
            </div>

            <div className="reveal hover-card md:col-span-1 p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center mb-5"><BarChart3 size={20} className="text-green-400" /></div>
              <h3 className="text-xl font-bold mb-3 tracking-tight">Analytics</h3>
              <p className="text-sm text-white/40 leading-relaxed">Revenue charts, engineer leaderboards, parts profitability, and industry benchmarks.</p>
            </div>

            <div className="reveal hover-card md:col-span-2 p-8 rounded-2xl border border-white/5 bg-white/[0.02] relative overflow-hidden">
              <div style={{ position: "absolute", bottom: -80, left: -80, width: 240, height: 240, borderRadius: "50%", background: "rgba(34,197,94,0.04)", filter: "blur(64px)" }} />
              <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center mb-5 relative"><Users size={20} className="text-green-400" /></div>
              <h3 className="text-xl font-bold mb-3 tracking-tight relative">Customer portal</h3>
              <p className="text-sm text-white/40 leading-relaxed relative">Customers track repairs in real time, chat with your shop, see photos, and leave ratings. No app download. No login required.</p>
            </div>

            <div className="reveal hover-card md:col-span-1 p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center mb-5"><Calendar size={20} className="text-yellow-400" /></div>
              <h3 className="text-xl font-bold mb-3 tracking-tight">Appointments</h3>
              <p className="text-sm text-white/40 leading-relaxed">Capacity-based booking slots. Customers book online. You confirm.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPETITOR COMPARISON ─────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight">Half the price. Twice the features.</h2>
          <p className="text-lg text-white/40 mt-4">RepairDesk charges $75-150/month. RepairShopr $50-150/month. FixFlow starts at $29.</p>
        </div>
        <div className="reveal max-w-4xl mx-auto rounded-2xl border border-white/8 overflow-hidden overflow-x-auto">
          <div className="grid grid-cols-5 bg-white/3 px-6 py-4 text-xs text-white/40 font-semibold uppercase tracking-wider" style={{ minWidth: 640 }}>
            <span>Feature</span><span>FixFlow</span><span>RepairDesk</span><span>RepairShopr</span><span>Fixably</span>
          </div>
          {COMPARISON_ROWS.map((r) => (
            <div key={r.label} className="grid grid-cols-5 px-6 py-4 border-t border-white/5 text-sm items-center" style={{ minWidth: 640 }}>
              <span className="text-white/60">{r.label}</span>
              <span className="text-blue-400 font-semibold">{r.fixflow}</span>
              <span className="text-white/30">{r.rd}</span>
              <span className="text-white/30">{r.rs}</span>
              <span className="text-white/30">{r.fb}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────────── */}
      <section className="reveal py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-5xl font-bold text-white mb-2" style={{ letterSpacing: "-3px" }}>{s.value}</div>
              <p className="text-sm text-white/30">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold tracking-tight">Simple pricing</h2>
            <p className="text-lg text-white/40 mt-3">Start free. No credit card required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`reveal hover-card p-7 rounded-2xl relative ${
                  plan.popular
                    ? "border border-blue-500/30 bg-blue-500/5"
                    : "border border-white/7 bg-white/[0.02]"
                }`}
                style={plan.popular ? { boxShadow: "0 0 60px rgba(37,99,235,0.08)" } : undefined}
              >
                {plan.popular && (
                  <span
                    className="bg-blue-600 text-white text-[10px] font-bold px-4 py-1 rounded-b-lg tracking-widest"
                    style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)" }}
                  >
                    MOST POPULAR
                  </span>
                )}
                <p className="text-sm text-white/40 mb-2 mt-3">{plan.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold" style={{ letterSpacing: "-2px" }}>{plan.price}</span>
                  <span className="text-white/30 text-sm">/mo</span>
                </div>
                <p className="text-xs text-white/30 mb-6">{plan.desc}</p>
                <Link
                  href="/register"
                  className={`block text-center font-semibold text-sm py-2.5 rounded-xl mb-6 transition-colors no-underline ${
                    plan.popular ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-white/5 hover:bg-white/10 text-white border border-white/8"
                  }`}
                >
                  Get started
                </Link>
                <div className="flex flex-col gap-3">
                  {plan.features.map((f) => (
                    <span key={f} className="flex items-center gap-2 text-sm text-white/50">
                      <Check size={12} className={plan.popular ? "text-blue-400" : "text-green-400"} /> {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
      <section className="reveal py-24 px-6 text-center border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center gap-1 mb-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={14} className="fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-4">Join 1,200+ repair shops already using FixFlow</h2>
          <p className="text-lg text-white/40 mb-10">14-day free trial. No credit card. Cancel anytime.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base px-10 py-4 rounded-xl transition-all hover:scale-105 active:scale-95 no-underline"
            style={{ boxShadow: "0 20px 50px rgba(59,130,246,0.2)" }}
          >
            Get started free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
              <Wrench size={14} color="white" />
            </div>
            <span className="font-bold">FixFlow</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-white/25">
            {FOOTER_LINKS.map((l) => {
              const href = l === "Track Repair" ? "/track" : l === "Privacy" ? "/privacy" : l === "Terms" ? "/terms" : `#${l.toLowerCase()}`;
              return (
                <a key={l} href={href} className="hover:text-white/50 transition-colors no-underline">{l}</a>
              );
            })}
          </div>
          <p className="text-xs text-white/20">© 2026 FixFlow</p>
        </div>
      </footer>
    </div>
  );
}
