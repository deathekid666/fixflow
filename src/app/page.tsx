"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ── Data ─────────────────────────────────────────────────────────────────────

const FLAGS = ["🇲🇦","🇫🇷","🇬🇧","🇺🇸","🇦🇪","🇸🇦","🇩🇿","🇹🇳","🇸🇳","🇨🇮","🇳🇬","🇰🇪","🇿🇦","🇩🇪","🇧🇪","🇳🇱","🇵🇹","🇮🇹","🇪🇸","🇨🇦","🇧🇷","🇶🇦"];
const FLAG_NAMES = ["Morocco","France","UK","USA","UAE","Saudi Arabia","Algeria","Tunisia","Senegal","Côte d'Ivoire","Nigeria","Kenya","South Africa","Germany","Belgium","Netherlands","Portugal","Italy","Spain","Canada","Brazil","Qatar"];

const OLD_WAY = [
  { text: "Repair updates buried in WhatsApp group chats" },
  { text: "Paper receipts that get lost or damaged" },
  { text: "Three Excel files, always out of sync" },
  { text: "20 'is my phone ready?' calls every day" },
  { text: "No idea what the shop actually made this month" },
  { text: "Warranty dates on stickers that fall off" },
];

const NEW_WAY = [
  { text: "Digital work orders created and tracked in seconds" },
  { text: "Customers get automatic SMS/WhatsApp updates" },
  { text: "One dashboard: orders, inventory, analytics" },
  { text: "Customers track their own repair via QR link" },
  { text: "Live revenue, margin, and expense tracking" },
  { text: "Warranty tracking with automatic expiry alerts" },
];

const FEATURES = [
  { icon: "📋", label: "Work Orders", title: "Full repair lifecycle management", desc: "Create, assign, and track every repair from intake to delivery. Photo docs, diagnosis checklists, parts logging, and a full audit trail." },
  { icon: "👤", label: "Customer Portal", title: "End the 'is my phone ready?' calls", desc: "Every repair gets a unique QR code. Customers scan to see live status, photos, and technician notes — no phone calls needed." },
  { icon: "🔧", label: "Inventory", title: "Know your stock. Always.", desc: "Manage parts with cost tracking, low-stock alerts, supplier purchase orders, and automatic deduction when parts are used." },
  { icon: "📊", label: "Analytics", title: "Revenue clarity without a spreadsheet", desc: "Live revenue charts, profit margins, engineer performance, expense tracking, and anonymous industry benchmarking." },
  { icon: "🤖", label: "AI Assistant", title: "Pricing & diagnostics powered by AI", desc: "Claude Opus suggests optimal prices based on your market, guides complex diagnostics, and explains repair reasoning step-by-step." },
  { icon: "👥", label: "Team & Commissions", title: "Manage your team like a pro", desc: "Add engineers, assign repairs, track turnaround time, compare leaderboard performance, and auto-calculate monthly commissions." },
];

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    sub: "14-day trial · No card needed",
    accent: "border-slate-800",
    badge: null,
    cta: { label: "Start Free Trial", href: "/register", style: "border border-slate-700 hover:border-blue-500/70 text-slate-300 hover:text-white" },
    features: ["50 work orders / month","1 admin + 3 engineers","Customer portal & QR tracking","Spare parts inventory","Repair templates & checklists","Basic analytics","CSV data import"],
    missing: ["AI price assistant","SMS/WhatsApp notifications","Advanced analytics","Expense tracking","Industry benchmarks","Commission tracking"],
  },
  {
    name: "Pro",
    price: "299",
    sub: "MAD / month · Cancel anytime",
    accent: "border-blue-500/50 shadow-2xl shadow-blue-500/10",
    badge: "Most Popular",
    cta: { label: "Join Waitlist →", href: "mailto:support@fixflow.ma?subject=Pro%20Plan%20Waitlist", style: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 btn-shimmer" },
    features: ["Unlimited work orders","Unlimited team members","Everything in Starter","AI price suggestions (Claude Opus)","SMS / WhatsApp notifications","Advanced analytics & reports","Expense & revenue tracking","Industry benchmarking","Auto commission calculation","Social media content export","Priority support"],
    missing: [],
  },
  {
    name: "Enterprise",
    price: "Custom",
    sub: "Multi-location · White-label",
    accent: "border-slate-700",
    badge: null,
    cta: { label: "Contact Sales", href: "mailto:support@fixflow.ma?subject=Enterprise%20Inquiry", style: "border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white" },
    features: ["Everything in Pro","Multi-shop dashboard","Cross-shop analytics","White-label branding","Custom integrations","Dedicated account manager","SLA uptime guarantee","On-site training available"],
    missing: [],
  },
];

const FAQS = [
  { q: "Is there a free trial?", a: "Yes — every new shop gets 14 days of full access with no credit card required. Explore every feature and decide if FixFlow is right for you before committing." },
  { q: "Can I use it on mobile?", a: "Absolutely. FixFlow is fully responsive and works on any phone or tablet. No app download needed — open it in your browser and it works like a native app." },
  { q: "How many users can I add?", a: "The Free Trial supports 1 admin and up to 3 engineers. The Pro plan includes unlimited team members — add as many technicians as you need at no extra per-seat cost." },
  { q: "Is my data secure?", a: "Yes. All data is encrypted in transit (HTTPS/TLS) and at rest. Each shop's data is fully isolated — no other shop can ever access your information." },
  { q: "Can I import my existing data?", a: "Yes. FixFlow supports CSV import for customers, work orders, and spare parts inventory. Most shops migrate from a spreadsheet in under 15 minutes." },
  { q: "What happens after the trial ends?", a: "You can upgrade to Pro or stay on a limited free plan. Your data is never deleted — you always have access to your full repair history." },
  { q: "Which currencies are supported?", a: "FixFlow supports MAD, EUR, USD, GBP, AED, and SAR. It's used by shops in 50+ countries across Africa, Europe, the Middle East, and beyond." },
  { q: "Is the AI assistant available on all plans?", a: "The AI price suggestion tool is included in Pro and Enterprise. During the trial, you get 10 AI suggestions to experience it firsthand." },
];

const TESTIMONIALS = [
  { quote: "Before FixFlow I had three WhatsApp groups and a notebook to track repairs. Now everything is in one place and I can see my full day in 10 seconds.", name: "Karim B.", shop: "ElectroFix, Casablanca", initials: "KB" },
  { quote: "Our customers love the QR tracking link. We went from 20 'is my phone ready?' calls per day to almost zero. Total game changer for my shop.", name: "Sara M.", shop: "TechRepair, Rabat", initials: "SM" },
  { quote: "The analytics showed me which repairs are actually profitable. I cut two low-margin services and revenue went up 18% the following month.", name: "Ahmed R.", shop: "iRepair, Marrakech", initials: "AR" },
];

const COURSES = [
  { emoji: "🌱", level: "Beginner", title: "Getting Started with FixFlow", lessons: 5, time: "55 min", color: "text-emerald-400", ring: "ring-emerald-500/30 bg-emerald-500/5" },
  { emoji: "⚡", level: "Intermediate", title: "Managing Your Repair Shop", lessons: 6, time: "75 min", color: "text-amber-400", ring: "ring-amber-500/30 bg-amber-500/5" },
  { emoji: "🔥", level: "Advanced", title: "Mastering Diagnostics", lessons: 5, time: "65 min", color: "text-rose-400", ring: "ring-rose-500/30 bg-rose-500/5" },
];

// ── Dashboard Mockup ──────────────────────────────────────────────────────────

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-[580px] mx-auto">
      {/* Glow */}
      <div className="absolute -inset-8 bg-blue-600/8 rounded-3xl blur-3xl pointer-events-none" />
      {/* Floating card 1 */}
      <div className="absolute -top-4 -right-4 sm:-right-10 z-20 animate-float bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-xl px-3 py-2 shadow-xl text-xs whitespace-nowrap">
        <span className="text-emerald-400 font-semibold">✅ WO-0091 ready for pickup</span>
      </div>
      {/* Floating card 2 */}
      <div className="absolute -bottom-4 -left-4 sm:-left-10 z-20 animate-float-slow bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-xl px-3 py-2 shadow-xl text-xs whitespace-nowrap">
        <span className="text-blue-400 font-semibold">💰 +1,450 MAD collected today</span>
      </div>
      {/* Browser frame */}
      <div className="relative bg-[#0d1117] rounded-2xl border border-slate-700/60 overflow-hidden shadow-2xl shadow-black/60 animate-glow">
        {/* Chrome bar */}
        <div className="bg-slate-800/70 px-4 py-2.5 flex items-center gap-2 border-b border-slate-700/50">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <div className="flex-1 mx-3 bg-slate-700/40 rounded-md h-5 flex items-center px-3">
            <span className="text-slate-500 text-[11px]">fixflow.app/dashboard</span>
          </div>
        </div>
        {/* App UI */}
        <div className="flex" style={{ height: 300 }}>
          {/* Sidebar */}
          <div className="w-10 sm:w-36 bg-slate-900/80 border-r border-slate-800/60 flex flex-col p-2 gap-0.5 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-2 mb-1">
              <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center text-white text-[10px] font-black">F</div>
              <span className="text-white text-xs font-bold">FixFlow</span>
            </div>
            {[["📋","Work Orders",true],["👤","Customers",false],["🔧","Parts",false],["📊","Analytics",false],["🎓","Academy",false],["⚙️","Settings",false]].map(([ic,lb,active]) => (
              <div key={lb as string} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] ${active ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"}`}>
                <span>{ic}</span>
                <span className="hidden sm:block truncate">{lb as string}</span>
              </div>
            ))}
          </div>
          {/* Main */}
          <div className="flex-1 p-3 space-y-2.5 overflow-hidden">
            {/* KPI row */}
            <div className="grid grid-cols-4 gap-1.5">
              {[["Active","23","text-blue-400","bg-blue-500/10"],["Today","12","text-emerald-400","bg-emerald-500/10"],["Revenue","48k","text-violet-400","bg-violet-500/10"],["Overdue","1","text-rose-400","bg-rose-500/10"]].map(([l,v,c,bg]) => (
                <div key={l as string} className={`${bg} rounded-lg p-2 border border-white/5`}>
                  <p className="text-slate-500 text-[9px] mb-0.5">{l as string}</p>
                  <p className={`font-bold text-sm ${c as string}`}>{v as string}</p>
                </div>
              ))}
            </div>
            {/* Orders table */}
            <div className="bg-slate-800/40 rounded-xl border border-slate-700/30 overflow-hidden">
              <div className="grid grid-cols-3 gap-2 px-3 py-1.5 border-b border-slate-700/40 bg-slate-800/40">
                {["Order","Customer","Status"].map(h => <span key={h} className="text-slate-500 text-[9px] font-semibold">{h}</span>)}
              </div>
              {[["WO-0091","Ahmed K.","REPAIRING","text-orange-400 bg-orange-500/10"],["WO-0090","Sara M.","DONE ✅","text-emerald-400 bg-emerald-500/10"],["WO-0089","Karim B.","RECEIVED","text-blue-400 bg-blue-500/10"],["WO-0088","Nadia R.","DELIVERED","text-slate-400 bg-slate-500/10"]].map(([num,name,status,color]) => (
                <div key={num as string} className="grid grid-cols-3 gap-2 px-3 py-1.5 border-b border-slate-800/40 last:border-0">
                  <span className="font-mono text-[10px] text-slate-400">{num as string}</span>
                  <span className="text-[10px] text-slate-200 truncate">{name as string}</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md inline-block leading-none ${color as string}`}>{status as string}</span>
                </div>
              ))}
            </div>
            {/* Mini chart */}
            <div className="bg-slate-800/40 rounded-xl border border-slate-700/30 p-2">
              <p className="text-[9px] text-slate-500 mb-1.5">Revenue this week (MAD)</p>
              <div className="flex items-end gap-1 h-8">
                {[45,62,38,71,55,88,64].map((h, i) => (
                  <div key={i} className="flex-1 bg-blue-500/30 rounded-sm" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AI Demo ───────────────────────────────────────────────────────────────────

function AIDemo({ visible }: { visible: boolean }) {
  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-slate-800/60 border-b border-slate-700/40 px-4 py-3 flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-black">F</div>
        <span className="text-sm font-semibold text-white">AI Price Suggestion</span>
        <span className="ml-auto text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">Claude Opus</span>
      </div>
      {/* Input context */}
      <div className="p-4 space-y-2 border-b border-slate-800">
        {[["📱","Device","Samsung Galaxy S23"],["📍","Location","Casablanca, Morocco"],["🔧","Repair type","Screen replacement"],["💸","Parts cost","450 MAD"]].map(([ic, label, val]) => (
          <div key={label as string} className="flex items-center gap-3 text-sm">
            <span>{ic}</span>
            <span className="text-slate-500 w-24 flex-shrink-0">{label as string}</span>
            <span className="text-slate-200 font-medium">{val as string}</span>
          </div>
        ))}
      </div>
      {/* AI Response */}
      <div className="p-4 space-y-3 min-h-[200px]">
        {visible && <>
          <div className="ai-msg ai-msg-1 flex items-start gap-2.5">
            <div className="w-6 h-6 bg-violet-600/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs">🤖</span>
            </div>
            <div className="bg-slate-800/60 rounded-xl px-3 py-2 text-sm text-slate-300">
              Analyzing 127 similar repairs in Casablanca…
            </div>
          </div>
          <div className="ai-msg ai-msg-2">
            <div className="bg-gradient-to-br from-blue-500/15 to-violet-500/10 border border-blue-500/20 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">💡 Suggested Price Range</p>
              <div className="space-y-2">
                {[["Minimum","750 MAD","text-slate-400",false],["Recommended","950 MAD","text-emerald-400",true],["Maximum","1,150 MAD","text-slate-400",false]].map(([lb,price,color,highlight]) => (
                  <div key={lb as string} className={`flex items-center justify-between px-3 py-2 rounded-lg ${highlight ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-slate-800/40"}`}>
                    <span className="text-sm text-slate-400">{lb as string}</span>
                    <span className={`font-bold text-sm ${color as string}`}>{price as string}</span>
                    {highlight && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">Best</span>}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 border-t border-slate-700/40">
                <span>Market avg: 900 MAD</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Confidence: HIGH</span>
              </div>
            </div>
          </div>
          <div className="ai-msg ai-msg-3 flex gap-2">
            <button className="flex-1 text-xs py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg border border-blue-500/20 transition-colors">Apply 750</button>
            <button className="flex-1 text-xs py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg border border-emerald-500/20 transition-colors font-semibold">Apply 950 ✓</button>
            <button className="flex-1 text-xs py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg border border-blue-500/20 transition-colors">Apply 1,150</button>
          </div>
        </>}
        {!visible && (
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <span className="dot-1 w-1.5 h-1.5 rounded-full bg-slate-600 inline-block" />
            <span className="dot-2 w-1.5 h-1.5 rounded-full bg-slate-600 inline-block" />
            <span className="dot-3 w-1.5 h-1.5 rounded-full bg-slate-600 inline-block" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [aiVisible, setAiVisible] = useState(false);
  const [demoEmail, setDemoEmail] = useState("");
  const [demoSent, setDemoSent] = useState(false);
  const aiRef = useRef<HTMLDivElement>(null);

  // Scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.setAttribute("data-visible", "1"); }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll("[data-animate]").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // AI demo trigger
  useEffect(() => {
    if (!aiRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAiVisible(false);
          const t = setTimeout(() => setAiVisible(true), 200);
          return () => clearTimeout(t);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(aiRef.current);
    return () => observer.disconnect();
  }, []);

  function handleDemoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDemoSent(true);
  }

  return (
    <div className="min-h-screen bg-[#020817] text-white overflow-x-hidden" style={{ fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ── CSS ── */}
      <style>{`
        [data-animate]{opacity:0;transform:translateY(22px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
        [data-animate][data-visible]{opacity:1;transform:none}
        [data-animate][data-d1]{transition-delay:.1s}[data-animate][data-d2]{transition-delay:.2s}[data-animate][data-d3]{transition-delay:.3s}
        [data-animate][data-d4]{transition-delay:.4s}[data-animate][data-d5]{transition-delay:.5s}[data-animate][data-d6]{transition-delay:.6s}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        .animate-float{animation:float 5s ease-in-out infinite}
        .animate-float-slow{animation:float 7s ease-in-out infinite 1s}
        @keyframes glow-pulse{0%,100%{box-shadow:0 0 30px rgba(59,130,246,.08)}50%{box-shadow:0 0 60px rgba(59,130,246,.2)}}
        .animate-glow{animation:glow-pulse 4s ease-in-out infinite}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .marquee-track{animation:marquee 35s linear infinite;display:flex;width:max-content}
        @keyframes hero-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        .h1a{animation:hero-up .8s .1s cubic-bezier(.16,1,.3,1) both}
        .h1b{animation:hero-up .8s .25s cubic-bezier(.16,1,.3,1) both}
        .h1c{animation:hero-up .8s .4s cubic-bezier(.16,1,.3,1) both}
        .hsub{animation:hero-up .8s .55s cubic-bezier(.16,1,.3,1) both}
        .hcta{animation:hero-up .8s .7s cubic-bezier(.16,1,.3,1) both}
        .htrust{animation:hero-up .8s .85s cubic-bezier(.16,1,.3,1) both}
        .gradient-text{background:linear-gradient(135deg,#60a5fa 0%,#a78bfa 40%,#34d399 100%);background-size:200% 200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:grad 6s ease infinite}
        @keyframes grad{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        .btn-shimmer{position:relative;overflow:hidden}
        .btn-shimmer::after{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);transform:skewX(-20deg);animation:shimmer 3s 2s ease-in-out infinite}
        @keyframes shimmer{0%{left:-100%}100%{left:200%}}
        @keyframes msg-appear{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}
        .ai-msg{opacity:0}
        .ai-msg-1{animation:msg-appear .5s .4s cubic-bezier(.16,1,.3,1) forwards}
        .ai-msg-2{animation:msg-appear .5s 1.2s cubic-bezier(.16,1,.3,1) forwards}
        .ai-msg-3{animation:msg-appear .5s 2.2s cubic-bezier(.16,1,.3,1) forwards}
        @keyframes typing{0%,60%,100%{transform:scale(0);opacity:.3}30%{transform:scale(1);opacity:1}}
        .dot-1{animation:typing 1.2s 0s infinite}.dot-2{animation:typing 1.2s .25s infinite}.dot-3{animation:typing 1.2s .5s infinite}
      `}</style>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#020817]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">F</div>
            <span className="text-lg font-bold tracking-tight">FixFlow</span>
            <span className="hidden sm:block text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full tracking-wide">BETA</span>
          </div>
          <div className="hidden md:flex items-center gap-7 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#ai" className="hover:text-white transition-colors">AI</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <Link href="/customer-app/my-repairs" className="text-blue-400 hover:text-blue-300 transition-colors">Track Repairs</Link>
          </div>
          <div className="hidden md:flex items-center gap-2.5">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5">Sign in</Link>
            <Link href="/register" className="text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-600/20 btn-shimmer">
              Start Free Trial
            </Link>
          </div>
          <button onClick={() => setMenuOpen(o => !o)} className="md:hidden p-2 text-slate-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#020817] px-5 py-4 space-y-3">
            {[["#features","Features"],["#ai","AI Assistant"],["#pricing","Pricing"],["#faq","FAQ"]].map(([href,label]) => (
              <a key={label} href={href} onClick={() => setMenuOpen(false)} className="block text-sm text-slate-400 hover:text-white py-1">{label}</a>
            ))}
            <Link href="/customer-app/my-repairs" onClick={() => setMenuOpen(false)} className="block text-sm text-blue-400 py-1">Track Your Repairs</Link>
            <div className="flex gap-2.5 pt-3 border-t border-white/5">
              <Link href="/login" className="flex-1 text-center text-sm text-slate-300 border border-slate-700 py-2.5 rounded-lg hover:border-slate-500 transition-colors">Sign in</Link>
              <Link href="/register" className="flex-1 text-center text-sm font-semibold bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-500 transition-colors">Free Trial</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_60%_-20%,rgba(59,130,246,.13),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_20%_80%,rgba(139,92,246,.06),transparent)]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="relative max-w-6xl mx-auto px-5 pt-20 pb-28 lg:pt-28">
          <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-16">
            {/* Left */}
            <div className="flex-1 text-center lg:text-left space-y-6 max-w-xl mx-auto lg:mx-0">
              <div className="h1a inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs px-3.5 py-1.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                Built for repair shops — Made for growth
              </div>
              <h1 className="text-[2.7rem] sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.08] tracking-tight">
                <span className="h1b block">Run your repair</span>
                <span className="h1c block">shop <span className="gradient-text">like a pro.</span></span>
              </h1>
              <p className="hsub text-slate-400 text-lg leading-relaxed">
                Work orders, customer tracking, inventory, payments, AI pricing, and analytics — one platform that finally replaces the WhatsApp groups and spreadsheets.
              </p>
              <div className="hcta flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <Link href="/register" className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-base transition-all shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-[1.02] btn-shimmer">
                  Start Free Trial — 14 Days →
                </Link>
                <button onClick={() => setDemoOpen(true)} className="w-full sm:w-auto px-8 py-3.5 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium rounded-xl text-base transition-colors flex items-center justify-center gap-2">
                  <span className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-xs">▶</span>
                  Watch Demo
                </button>
              </div>
              <div className="htrust flex items-center justify-center lg:justify-start gap-5 text-xs text-slate-600 flex-wrap">
                <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> No credit card</span>
                <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> 14-day free trial</span>
                <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Cancel anytime</span>
              </div>
            </div>
            {/* Right */}
            <div className="flex-1 w-full">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof Bar ─────────────────────────────────────────────── */}
      <div className="border-y border-white/5 bg-slate-900/20">
        {/* Stats */}
        <div className="max-w-4xl mx-auto px-5 py-8 grid grid-cols-3 gap-4 text-center">
          {[["500+","repair shops"],["50,000+","repairs tracked"],["50+","countries"],].map(([v, l]) => (
            <div key={l}>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">{v}</p>
              <p className="text-xs text-slate-500 mt-0.5">{l}</p>
            </div>
          ))}
        </div>
        {/* Marquee */}
        <div className="overflow-hidden pb-6">
          <p className="text-center text-xs text-slate-600 mb-4 font-medium tracking-widest uppercase">Trusted by shops in 50+ countries</p>
          <div className="overflow-hidden">
            <div className="marquee-track">
              {[...FLAGS, ...FLAGS].map((flag, i) => (
                <div key={i} className="flex flex-col items-center gap-1 mx-4 flex-shrink-0">
                  <span className="text-2xl">{flag}</span>
                  <span className="text-[10px] text-slate-600 hidden sm:block">{FLAG_NAMES[i % FLAG_NAMES.length]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Old Way vs FixFlow ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 py-24">
        <div className="text-center mb-14" data-animate>
          <p className="text-xs font-semibold text-rose-400 uppercase tracking-widest mb-3">Sound familiar?</p>
          <h2 className="text-3xl sm:text-4xl font-bold">The old way vs. the FixFlow way</h2>
          <p className="text-slate-400 mt-3 max-w-lg mx-auto">Most shops still run on chaos. FixFlow fixes that.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Old */}
          <div className="bg-rose-500/5 border border-rose-500/15 rounded-2xl p-6" data-animate>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-rose-500/15 rounded-xl flex items-center justify-center text-rose-400 font-bold text-sm">✕</div>
              <h3 className="font-semibold text-rose-300">The old way</h3>
            </div>
            <div className="space-y-3">
              {OLD_WAY.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-rose-500/15 text-rose-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">✕</span>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
          {/* New */}
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-6" data-animate data-d2>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-emerald-500/15 rounded-xl flex items-center justify-center text-emerald-400 font-bold text-sm">✓</div>
              <h3 className="font-semibold text-emerald-300">The FixFlow way</h3>
            </div>
            <div className="space-y-3">
              {NEW_WAY.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                  <p className="text-sm text-slate-300 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="bg-slate-900/25 border-y border-white/5 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 py-24">
          <div className="text-center mb-14" data-animate>
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Everything your shop needs</h2>
            <p className="text-slate-400 mt-3 max-w-lg mx-auto">One platform to replace the spreadsheets, paper receipts, and WhatsApp groups — forever.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="group bg-slate-900/60 border border-white/5 hover:border-blue-500/25 rounded-2xl p-6 space-y-3 transition-all hover:bg-slate-900/80 hover:shadow-lg hover:shadow-blue-500/5 cursor-default" data-animate data-d={String(i % 3 + 1)}>
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 bg-slate-800 group-hover:bg-blue-600/15 rounded-xl flex items-center justify-center text-2xl transition-colors">
                    {f.icon}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">{f.label}</span>
                </div>
                <h3 className="font-semibold text-white leading-snug">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Section ───────────────────────────────────────────────────── */}
      <section id="ai" className="max-w-6xl mx-auto px-5 py-24 scroll-mt-16">
        <div className="flex flex-col lg:flex-row items-center gap-14">
          {/* Left */}
          <div className="flex-1 space-y-6" data-animate>
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs px-3.5 py-1.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
              Powered by Claude Opus
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
              Meet your AI<br />
              <span className="gradient-text">repair assistant.</span>
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Claude Opus — the world&apos;s most capable AI model — is built directly into FixFlow. It analyzes your repair context, local market data, and parts costs to suggest optimal prices and guide complex diagnostics.
            </p>
            <div className="space-y-3">
              {[
                ["💡","Price suggestions","AI analyzes 100+ similar repairs in your city to suggest min, recommended, and max prices with full reasoning."],
                ["🔍","Diagnostic guidance","Describe the fault and get structured diagnostic steps, likely components, and success probability."],
                ["📝","Auto-notes","AI summarizes repair context into professional technician notes you can share with customers."],
              ].map(([ic, title, desc]) => (
                <div key={title as string} className="flex gap-3 p-3 rounded-xl hover:bg-slate-900/40 transition-colors">
                  <span className="text-xl flex-shrink-0 mt-0.5">{ic}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{title as string}</p>
                    <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{desc as string}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Right: AI Demo */}
          <div className="flex-1 w-full max-w-md mx-auto lg:mx-0" ref={aiRef} data-animate data-d3>
            <AIDemo visible={aiVisible} />
          </div>
        </div>
      </section>

      {/* ── Directory ────────────────────────────────────────────────────── */}
      <section className="bg-slate-900/25 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-5 py-24">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-6" data-animate>
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Shop Network</p>
              <h2 className="text-3xl sm:text-4xl font-bold">Join the FixFlow Network.</h2>
              <p className="text-slate-400 leading-relaxed max-w-lg">
                Get discovered by customers in your area. Every FixFlow shop gets a verified public profile with customer ratings, repair history, and a map listing — completely free.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[["⭐","Real ratings","From verified customers"],["📍","Map listing","Get found locally"],["🏆","Certification","Bronze → Gold badges"],["📅","Appointments","Let customers book online"]].map(([ic, t, d]) => (
                  <div key={t as string} className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
                    <div className="text-xl mb-2">{ic}</div>
                    <p className="text-sm font-semibold text-white">{t as string}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{d as string}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 flex-wrap">
                <Link href="/directory" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02]">Browse Shops →</Link>
                <Link href="/register" className="px-6 py-3 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white rounded-xl text-sm transition-colors">Add Your Shop</Link>
              </div>
            </div>
            {/* Map preview */}
            <div className="flex-shrink-0 w-full max-w-sm" data-animate data-d3>
              <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 space-y-3">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active shops by region</p>
                {[["🇲🇦 Morocco","120+ shops",80],["🇫🇷 France","85+ shops",55],["🇦🇪 UAE & Gulf","70+ shops",46],["🇩🇿 Algeria","50+ shops",32],["🇹🇳 Tunisia","40+ shops",26],["🌍 Other 45+","135+ shops",88]].map(([country, count, pct]) => (
                  <div key={country as string} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">{country as string}</span>
                      <span className="text-slate-500">{count as string}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Academy ──────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 py-24">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Courses */}
          <div className="flex-1 space-y-4" data-animate>
            {COURSES.map((c, i) => (
              <div key={c.title} className={`group bg-slate-900/60 border border-white/5 hover:border-slate-600 rounded-2xl p-5 flex items-center gap-5 transition-all hover:bg-slate-900/90 cursor-pointer`} data-animate data-d={String(i + 1)}>
                <div className={`w-12 h-12 rounded-xl ring-1 ${c.ring} flex items-center justify-center text-2xl flex-shrink-0`}>{c.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold ${c.color}`}>{c.level}</span>
                    <span className="text-slate-700">·</span>
                    <span className="text-xs text-slate-500">{c.lessons} lessons · {c.time}</span>
                  </div>
                  <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                </div>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex-shrink-0">Free</span>
              </div>
            ))}
          </div>
          {/* Text */}
          <div className="flex-1 space-y-6 order-first lg:order-last" data-animate>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">FixFlow Academy</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Learn and grow<br />with FixFlow.</h2>
            <p className="text-slate-400 leading-relaxed">
              Free courses taught by the FixFlow team, designed for repair shop owners and technicians. Learn pricing strategy, team management, diagnostics, and more — at your own pace.
            </p>
            <div className="space-y-2.5">
              {["3 free courses · 16 lessons · 3h total","Completion certificates with unique codes","Publicly verifiable at fixflow.app/verify","Works on mobile — learn between repairs"].map(item => (
                <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="text-emerald-400">✓</span>{item}
                </div>
              ))}
            </div>
            <Link href="/dashboard/academy" className="inline-block px-7 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-white font-medium rounded-xl text-sm transition-all">
              Explore Free Courses →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="bg-slate-900/25 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-5 py-20">
          <div className="text-center mb-12" data-animate>
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-3xl font-bold">Loved by repair shops worldwide</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className="bg-slate-900/80 border border-white/5 rounded-2xl p-6 flex flex-col gap-5" data-animate data-d={String(i + 1)}>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, j) => <span key={j} className="text-amber-400 text-sm">★</span>)}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                  <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">{t.initials}</div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.shop}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="max-w-6xl mx-auto px-5 py-24 scroll-mt-16">
        <div className="text-center mb-14" data-animate>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold">Simple, transparent pricing.</h2>
          <p className="text-slate-400 mt-3">Start free. Upgrade when you&apos;re ready.</p>
          <div className="inline-flex items-center gap-2 mt-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs px-3.5 py-1.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
            💳 Payments coming soon — join the waitlist for early access
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan, pi) => (
            <div key={plan.name} className={`relative bg-slate-900/80 border ${plan.accent} rounded-2xl p-7 flex flex-col`} data-animate data-d={String(pi + 1)}>
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded-full font-bold tracking-wide shadow-lg shadow-blue-600/40">{plan.badge}</span>
                </div>
              )}
              {plan.name === "Pro" && <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent rounded-2xl pointer-events-none" />}
              <div className="relative mb-6">
                <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${plan.name === "Pro" ? "text-blue-400" : "text-slate-400"}`}>{plan.name}</p>
                <div className="flex items-end gap-1.5">
                  {plan.price === "Free" ? (
                    <span className="text-4xl font-extrabold text-white">Free</span>
                  ) : plan.price === "Custom" ? (
                    <span className="text-4xl font-extrabold text-white">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-extrabold text-white leading-none">{plan.price}</span>
                      <span className="text-slate-400 text-sm mb-1">MAD</span>
                    </>
                  )}
                </div>
                <p className="text-slate-500 text-xs mt-1.5">{plan.sub}</p>
              </div>
              <div className="h-px bg-white/5 mb-5" />
              <div className="flex-1 space-y-2.5 mb-6">
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-2.5">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] ${plan.name === "Pro" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/15 text-emerald-400"}`}>✓</span>
                    <span className="text-sm text-slate-300 leading-snug">{f}</span>
                  </div>
                ))}
                {plan.missing.map(f => (
                  <div key={f} className="flex items-start gap-2.5 opacity-40">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] bg-slate-700 text-slate-500">–</span>
                    <span className="text-sm text-slate-500 leading-snug">{f}</span>
                  </div>
                ))}
              </div>
              <a href={plan.cta.href} className={`relative block w-full text-center py-3.5 rounded-xl font-semibold text-sm transition-all ${plan.cta.style}`}>{plan.cta.label}</a>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-600 mt-8">
          Questions? <a href="mailto:support@fixflow.ma" className="text-slate-400 hover:text-white transition-colors">support@fixflow.ma</a>
        </p>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="bg-slate-900/25 border-y border-white/5 scroll-mt-16">
        <div className="max-w-3xl mx-auto px-5 py-24">
          <div className="text-center mb-12" data-animate>
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Common questions</h2>
            <p className="text-slate-400 mt-3">Can&apos;t find your answer? <a href="mailto:support@fixflow.ma" className="text-blue-400 hover:text-blue-300 transition-colors">Email us</a></p>
          </div>
          <div className="space-y-2" data-animate>
            {FAQS.map((faq, i) => {
              const open = faqOpen === i;
              return (
                <div key={i} className={`border rounded-xl overflow-hidden transition-colors ${open ? "border-slate-700 bg-slate-900/70" : "border-white/5 hover:border-white/10"}`}>
                  <button onClick={() => setFaqOpen(open ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left gap-4">
                    <span className="font-medium text-white text-sm leading-snug">{faq.q}</span>
                    <span className={`text-slate-500 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </span>
                  </button>
                  {open && (
                    <div className="px-5 pb-5 border-t border-white/5">
                      <p className="text-sm text-slate-400 leading-relaxed pt-4">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(59,130,246,.08),transparent)]" />
        <div className="relative max-w-3xl mx-auto px-5 py-28 text-center space-y-7" data-animate>
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs px-3.5 py-1.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Free for 14 days — no card required
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold leading-tight">
            Ready to run a<br /><span className="gradient-text">smarter shop?</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">
            Join 500+ repair shops that replaced their WhatsApp groups and spreadsheets with FixFlow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register" className="w-full sm:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-lg transition-all shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-[1.02] btn-shimmer">
              Start Your Free Trial →
            </Link>
            <Link href="/customer-app/my-repairs" className="w-full sm:w-auto px-8 py-4 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium rounded-xl text-base transition-colors">
              Track Repairs (No Account)
            </Link>
          </div>
          <p className="text-xs text-slate-600">14 days free · No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#020817]">
        <div className="max-w-6xl mx-auto px-5 pt-16 pb-10 grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">F</div>
              <span className="text-lg font-bold">FixFlow</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">Repair shop management, simplified. Built for shops that want to grow.</p>
            <a href="mailto:support@fixflow.ma" className="text-xs text-slate-500 hover:text-slate-300 transition-colors block">support@fixflow.ma</a>
            <div className="flex gap-3">
              {[["𝕏","https://x.com/"],["in","https://linkedin.com/"],["📷","https://instagram.com/"]].map(([icon, href]) => (
                <a key={icon as string} href={href as string} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors text-xs font-bold">
                  {icon as string}
                </a>
              ))}
            </div>
          </div>
          {/* Product */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Product</p>
            <div className="space-y-2.5">
              {[["#features","Features"],["#ai","AI Assistant"],["#pricing","Pricing"],["#faq","FAQ"],["https://fixflow.app/directory","Directory"]].map(([href, label]) => (
                <a key={label as string} href={href as string} className="block text-sm text-slate-500 hover:text-white transition-colors">{label as string}</a>
              ))}
            </div>
          </div>
          {/* For shops */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">For Shops</p>
            <div className="space-y-2.5">
              {[["/register","Start Free Trial"],["/login","Sign In"],["/dashboard/academy","Academy"],["/customer-app","Customer App"]].map(([href, label]) => (
                <Link key={label as string} href={href as string} className="block text-sm text-slate-500 hover:text-white transition-colors">{label as string}</Link>
              ))}
            </div>
          </div>
          {/* Legal */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Legal</p>
            <div className="space-y-2.5">
              {[["/terms","Terms of Service"],["/privacy","Privacy Policy"],["/security","Security"]].map(([href, label]) => (
                <Link key={label as string} href={href as string} className="block text-sm text-slate-500 hover:text-white transition-colors">{label as string}</Link>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 px-5 py-5 max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} FixFlow. All rights reserved.</p>
          <p className="text-xs text-slate-600">Made with 🔧 for repair shops worldwide</p>
        </div>
      </footer>

      {/* ── Demo Modal ───────────────────────────────────────────────────── */}
      {demoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setDemoOpen(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="font-bold text-white">See FixFlow in Action</h3>
              <button onClick={() => setDemoOpen(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-6">
              {/* Video placeholder */}
              <div className="aspect-video bg-slate-800 rounded-xl flex flex-col items-center justify-center border border-slate-700 space-y-3">
                <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-full flex items-center justify-center">
                  <span className="text-3xl">▶</span>
                </div>
                <p className="text-slate-400 text-sm">Demo video coming soon</p>
              </div>
              {!demoSent ? (
                <form onSubmit={handleDemoSubmit} className="space-y-3">
                  <p className="text-sm text-slate-400">Be the first to see the demo — we&apos;ll notify you when it&apos;s ready:</p>
                  <div className="flex gap-2">
                    <input type="email" value={demoEmail} onChange={e => setDemoEmail(e.target.value)} placeholder="your@email.com" required className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" />
                    <button type="submit" className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors">Notify me</button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-2 text-emerald-400 text-sm font-medium">
                  ✅ You&apos;re on the list! We&apos;ll email you when the demo is ready.
                </div>
              )}
              <div className="flex gap-2">
                <Link href="/register" onClick={() => setDemoOpen(false)} className="flex-1 text-center py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors">
                  Start Free Trial Instead →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
