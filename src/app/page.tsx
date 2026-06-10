"use client";
import { useState } from "react";
import Link from "next/link";

const FEATURES = [
  { icon: "📋", title: "Work Order Management", desc: "Create, assign, and track every repair from intake to delivery. Custom statuses, overdue alerts, and a full audit trail." },
  { icon: "👤", title: "Customer Portal", desc: "Customers scan a QR code to track their repair in real time. Fewer calls, higher trust, better reviews." },
  { icon: "💰", title: "Payments & Revenue", desc: "Log cash, card, and bank transfers per order. See what's collected and what's outstanding at a glance." },
  { icon: "🔧", title: "Spare Parts Inventory", desc: "Manage your parts catalog, set reorder thresholds, and track usage per repair automatically." },
  { icon: "📊", title: "Analytics & Reports", desc: "Revenue charts, expense tracking, engineer performance, and month-over-month comparisons — all in one place." },
  { icon: "🛡️", title: "Warranty Tracking", desc: "Track active, expiring, and expired warranties across every device you've repaired. Never miss a claim window." },
  { icon: "🗂️", title: "Repair Templates", desc: "Save common repairs as templates. Auto-fill parts, labor, and pricing to create orders in seconds." },
  { icon: "✅", title: "Diagnosis Checklist", desc: "Document device condition at intake with a built-in checklist. Protect yourself from disputes." },
  { icon: "👥", title: "Team Management", desc: "Add engineers, assign orders, track completion rates, and measure turnaround time per technician." },
];

const STEPS = [
  { num: "01", title: "Create a work order", desc: "Log the device, fault description, customer info, and assign it to an engineer in under a minute." },
  { num: "02", title: "Repair & track progress", desc: "Update status, add parts, upload photos, and log diagnosis notes as the repair progresses." },
  { num: "03", title: "Deliver & get paid", desc: "Mark as done, collect payment, send a delivery notification, and log the warranty end date." },
];

const PAIN_POINTS = [
  { icon: "📱", title: "WhatsApp chaos", desc: "Tracking repairs across multiple group chats, losing important messages." },
  { icon: "📄", title: "Paper receipts", desc: "Hand-written notes that get lost, smudged, or impossible to search through." },
  { icon: "🗃️", title: "Spreadsheet hell", desc: "A different Excel file for orders, inventory, and expenses — always out of sync." },
  { icon: "📞", title: "Constant calls", desc: "Customers calling every hour asking 'Is my phone ready yet?'" },
  { icon: "💸", title: "No revenue clarity", desc: "No idea how much the shop actually made or spent this month." },
  { icon: "⚠️", title: "Missed warranties", desc: "Warranty end dates written on stickers that fall off or get thrown away." },
];

const TESTIMONIALS = [
  {
    quote: "Before FixFlow I had three WhatsApp groups and a notebook to track repairs. Now everything is in one place and I can see my full day in 10 seconds.",
    name: "Karim B.",
    shop: "ElectroFix, Casablanca",
    initials: "KB",
  },
  {
    quote: "Our customers love the QR tracking link. We went from 20 'is my phone ready?' calls per day to almost zero. It's a game changer.",
    name: "Sara M.",
    shop: "TechRepair, Rabat",
    initials: "SM",
  },
  {
    quote: "I finally know exactly how much revenue my shop makes, which engineers are fastest, and what parts I'm running low on — without doing any manual work.",
    name: "Ahmed R.",
    shop: "iRepair, Marrakech",
    initials: "AR",
  },
];

const FAQS = [
  {
    q: "Is there a free trial?",
    a: "Yes — every new shop gets 14 days of full access with no credit card required. You can explore every feature and decide if FixFlow is right for you before committing.",
  },
  {
    q: "Can I use it on mobile?",
    a: "Absolutely. FixFlow is fully responsive and works great on any phone or tablet — no app download needed. Just open it in your mobile browser and it works like a native app.",
  },
  {
    q: "How many users can I add?",
    a: "The Free Trial supports 1 admin and up to 3 engineers. The Pro plan includes unlimited team members — add as many technicians as your shop needs at no extra cost per seat.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted in transit (HTTPS) and at rest. Each shop's data is completely isolated — no other shop can ever access your information.",
  },
  {
    q: "Can I import my existing data?",
    a: "Yes. FixFlow supports CSV import for customers, work orders, and spare parts inventory. You can migrate from a spreadsheet in minutes.",
  },
  {
    q: "What happens after the trial ends?",
    a: "You can choose to upgrade to Pro or stay on a limited free plan. Your data is never deleted — you'll always have access to your history.",
  },
];




function DashboardMockup() {
  return (
    <div className="relative w-full max-w-xl mx-auto lg:mx-0">
      <div className="absolute -inset-6 bg-blue-600/10 rounded-3xl blur-3xl" />
      <div className="absolute -inset-2 bg-blue-500/5 rounded-3xl blur-xl" />
      <div className="relative bg-slate-900 rounded-2xl border border-slate-700/80 overflow-hidden shadow-2xl shadow-black/60">
        {/* Browser chrome */}
        <div className="bg-slate-800/80 px-4 py-2.5 flex items-center gap-2 border-b border-slate-700/60">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <div className="flex-1 mx-3 bg-slate-700/50 rounded-md h-5 flex items-center px-2.5">
            <span className="text-slate-500 text-xs">fixflow.app/dashboard</span>
          </div>
        </div>
        <div className="flex h-60 sm:h-72">
          <div className="w-28 sm:w-36 bg-slate-900 border-r border-slate-800/80 p-2.5 flex-shrink-0">
            <div className="text-xs font-semibold text-white mb-3 px-2">FixFlow</div>
            {[["📋","Work Orders",true],["👤","Customers",false],["🔧","Parts",false],["📊","Analytics",false],["⚙️","Settings",false]].map(([icon,label,active]) => (
              <div key={label as string} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs mb-0.5 ${active ? "bg-blue-600 text-white" : "text-slate-500"}`}>
                <span className="text-sm">{icon}</span>
                <span className="truncate hidden sm:block">{label}</span>
              </div>
            ))}
          </div>
          <div className="flex-1 p-3 space-y-2.5 overflow-hidden bg-slate-950/40">
            <div className="grid grid-cols-3 gap-2">
              {[["Active","23","text-blue-400","bg-blue-500/10"],["Revenue","48.5k","text-emerald-400","bg-emerald-500/10"],["Done Today","12","text-green-400","bg-green-500/10"]].map(([l,v,c,bg]) => (
                <div key={l} className={`${bg} rounded-lg p-2 border border-white/5`}>
                  <p className="text-slate-500 text-xs leading-none mb-1">{l}</p>
                  <p className={`font-bold text-sm ${c}`}>{v}</p>
                </div>
              ))}
            </div>
            <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/40">
              <div className="grid grid-cols-3 gap-2 px-3 py-1.5 border-b border-slate-700/50 bg-slate-800/50">
                {["Order #","Customer","Status"].map(h => <span key={h} className="text-slate-500 text-xs font-medium">{h}</span>)}
              </div>
              {[
                ["WO-0091","Ahmed K.","REPAIRING","text-orange-400 bg-orange-500/10"],
                ["WO-0090","Sara M.","DONE","text-green-400 bg-green-500/10"],
                ["WO-0089","Karim B.","RECEIVED","text-blue-400 bg-blue-500/10"],
                ["WO-0088","Nadia R.","DELIVERED","text-slate-400 bg-slate-500/10"],
              ].map(([num,name,status,color]) => (
                <div key={num} className="grid grid-cols-3 gap-2 px-3 py-2 border-b border-slate-800/40">
                  <span className="font-mono text-xs text-slate-400">{num}</span>
                  <span className="text-xs text-white truncate">{name}</span>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md inline-block leading-none ${color}`}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white tracking-tight">FixFlow</span>
            <span className="hidden sm:block text-xs bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">Beta</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5">Sign in</Link>
            <Link href="/register" className="text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-600/20">
              Start Free Trial
            </Link>
          </div>
          <button onClick={() => setMenuOpen(o => !o)} className="md:hidden text-slate-400 hover:text-white p-1.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950 px-5 py-4 space-y-3">
            {[["#features","Features"],["#how-it-works","How it works"],["#pricing","Pricing"],["#faq","FAQ"]].map(([href, label]) => (
              <a key={label} href={href} onClick={() => setMenuOpen(false)} className="block text-sm text-slate-400 hover:text-white py-0.5">{label}</a>
            ))}
            <div className="flex gap-3 pt-2 border-t border-slate-800">
              <Link href="/login" className="flex-1 text-center text-sm text-slate-300 border border-slate-700 py-2 rounded-lg hover:border-slate-500 transition-colors">Sign in</Link>
              <Link href="/register" className="flex-1 text-center text-sm font-semibold bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-500 transition-colors">Free Trial</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.15),transparent)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-5 pt-20 pb-24 lg:pt-28">
          <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-10">
            <div className="flex-1 text-center lg:text-left space-y-7 max-w-xl mx-auto lg:mx-0">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-3.5 py-1.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                Built for repair shops · Made in Morocco
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold leading-[1.12] tracking-tight">
                Stop managing repairs<br className="hidden sm:block" />
                {" "}with{" "}
                <span className="relative">
                  <span className="text-slate-600 line-through decoration-red-500/60 decoration-2">WhatsApp</span>
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 bg-clip-text text-transparent">Use FixFlow instead</span>
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed">
                Work orders, customer tracking, spare parts, payments, and analytics — one clean dashboard that replaces the spreadsheets, sticky notes, and group chats.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <Link href="/register"
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all text-base shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-[1.02]">
                  Start Free — 14 Days →
                </Link>
                <a href="#how-it-works"
                  className="w-full sm:w-auto px-8 py-3.5 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium rounded-xl transition-colors text-base flex items-center justify-center gap-2">
                  See how it works
                </a>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-5 text-xs text-slate-600 pt-1">
                <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> No credit card</span>
                <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> 14-day free trial</span>
                <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Cancel anytime</span>
              </div>
            </div>
            <div className="flex-1 w-full">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="border-y border-slate-800 bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-5 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "500+", label: "Work orders tracked" },
            { value: "30+", label: "Active shops" },
            { value: "99.9%", label: "Uptime" },
            { value: "4.9★", label: "Avg rating" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pain points */}
      <section className="max-w-6xl mx-auto px-5 py-24 scroll-mt-16">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-rose-400 uppercase tracking-widest mb-3">Sound familiar?</p>
          <h2 className="text-3xl sm:text-4xl font-bold">This is how most shops run today</h2>
          <p className="text-slate-400 mt-3 max-w-lg mx-auto">Managing a repair shop shouldn't feel like this — but for most shops, it does.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PAIN_POINTS.map(p => (
            <div key={p.title} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                {p.icon}
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 text-sm">{p.title}</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <p className="text-slate-400 text-sm">FixFlow replaces all of that. <a href="#features" className="text-blue-400 hover:text-blue-300 transition-colors">See how →</a></p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-slate-900/30 border-y border-slate-800 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 py-24">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Everything your shop needs</h2>
            <p className="text-slate-400 mt-3 max-w-xl mx-auto">One platform to replace the spreadsheets, WhatsApp notes, and paper receipts.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="group bg-slate-900 border border-slate-800 hover:border-blue-500/30 rounded-2xl p-6 space-y-3 transition-all duration-200 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-blue-500/5">
                <div className="w-10 h-10 bg-slate-800 group-hover:bg-blue-600/20 rounded-xl flex items-center justify-center text-xl transition-colors duration-200">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-16">
        <div className="max-w-5xl mx-auto px-5 py-24">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Up and running in minutes</h2>
            <p className="text-slate-400 mt-3">No training required. Most shops are live within 15 minutes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative flex flex-col items-start gap-4">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-full w-full h-px bg-gradient-to-r from-slate-700 to-transparent -translate-y-0.5 z-0" />
                )}
                <div className="relative z-10 w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
                  <span className="text-blue-400 text-xs font-bold">{step.num}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-900/30 border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-5 py-24">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Shops love it</h2>
            <p className="text-slate-400 mt-3">Real feedback from real repair shop owners.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5">
                {/* Stars */}
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3 border-t border-slate-800 pt-4">
                  <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">
                    {t.initials}
                  </div>
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

      {/* Pricing */}
      <section id="pricing" className="bg-slate-900/30 border-y border-slate-800 scroll-mt-16">
        <div className="max-w-5xl mx-auto px-5 py-24">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Simple, honest pricing</h2>
            <p className="text-slate-400 mt-3">Start free. Upgrade when your shop grows.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Trial card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col">
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Free Trial</p>
                <div className="flex items-end gap-2 mt-4">
                  <span className="text-5xl font-bold text-white leading-none">0</span>
                  <span className="text-slate-400 text-base mb-1">MAD</span>
                </div>
                <p className="text-slate-500 text-sm mt-2">14 days · No credit card required</p>
              </div>
              <div className="h-px bg-slate-800 mb-6" />
              <ul className="space-y-3.5 flex-1">
                {[
                  "50 work orders / month",
                  "1 admin + 3 engineers",
                  "Customer portal & QR tracking",
                  "Spare parts inventory",
                  "Repair templates",
                  "Diagnosis checklists",
                  "Basic analytics",
                ].map(f => (
                  <li key={f} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                      </svg>
                    </span>
                    <span className="text-sm text-slate-300">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 block w-full text-center py-3.5 border border-slate-700 hover:border-blue-500 hover:text-blue-400 text-slate-300 font-semibold rounded-xl transition-all duration-200 text-sm"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Pro card */}
            <div className="relative bg-slate-900 border border-blue-500/60 rounded-2xl p-8 flex flex-col shadow-2xl shadow-blue-600/10">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/8 via-transparent to-transparent rounded-2xl pointer-events-none" />
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                <span className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded-full font-bold tracking-wide shadow-lg shadow-blue-600/40">
                  Most Popular
                </span>
              </div>
              <div className="mb-6 relative">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Pro</p>
                <div className="flex items-end gap-2 mt-4">
                  <span className="text-5xl font-bold text-white leading-none">299</span>
                  <span className="text-slate-400 text-base mb-1">MAD</span>
                </div>
                <p className="text-slate-500 text-sm mt-2">per month · Cancel anytime</p>
              </div>
              <div className="h-px bg-blue-500/20 mb-5" />
              <div className="relative flex-1">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">Everything in Free Trial, plus:</p>
                <ul className="space-y-3.5">
                  {[
                    "Unlimited work orders",
                    "Unlimited team members",
                    "Advanced analytics & reports",
                    "Expense tracking",
                    "Warranty tracking",
                    "SMS notifications",
                    "Custom shop branding",
                    "Priority support",
                  ].map(f => (
                    <li key={f} className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-blue-500/15 border border-blue-500/40 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                        </svg>
                      </span>
                      <span className="text-sm text-slate-200">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href="mailto:support@fixflow.ma"
                className="relative mt-8 block w-full text-center py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all duration-200 text-sm shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-[1.02]"
              >
                Upgrade to Pro →
              </a>
            </div>
          </div>

          <p className="text-center text-xs text-slate-600 mt-10">
            Questions?{" "}
            <a href="mailto:support@fixflow.ma" className="text-slate-400 hover:text-white transition-colors">
              support@fixflow.ma
            </a>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-5 py-24 scroll-mt-16">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold">Common questions</h2>
          <p className="text-slate-400 mt-3">
            Can't find your answer?{" "}
            <a href="mailto:support@fixflow.ma" className="text-blue-400 hover:text-blue-300 transition-colors">Email us</a>
          </p>
        </div>
        <div className="space-y-2">
          {FAQS.map((faq, i) => {
            const open = faqOpen === i;
            return (
              <div key={i} className={`border rounded-xl overflow-hidden transition-colors ${open ? "border-slate-700 bg-slate-900/60" : "border-slate-800 hover:border-slate-700"}`}>
                <button
                  onClick={() => setFaqOpen(open ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
                >
                  <span className="font-medium text-white text-sm leading-snug">{faq.q}</span>
                  <span className={`text-slate-500 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                {open && (
                  <div className="px-6 pb-5 border-t border-slate-800">
                    <p className="text-sm text-slate-400 leading-relaxed pt-4">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-t border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(59,130,246,0.08),transparent)]" />
        <div className="relative max-w-3xl mx-auto px-5 py-28 text-center space-y-7">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-3.5 py-1.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Free for 14 days · No card required
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold leading-tight">
            Run a smarter<br />repair shop today
          </h2>
          <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">
            Join repair shops that replaced their WhatsApp groups and spreadsheets with FixFlow.
          </p>
          <Link href="/register"
            className="inline-block px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all text-lg shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-[1.02]">
            Start Your Free Trial →
          </Link>
          <p className="text-xs text-slate-600">14 days free · No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="max-w-6xl mx-auto px-5 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1 space-y-3">
            <div className="font-bold text-white text-lg">FixFlow</div>
            <p className="text-sm text-slate-500 leading-relaxed">Repair shop management, simplified.</p>
            <a href="mailto:support@fixflow.ma" className="text-xs text-slate-500 hover:text-slate-300 transition-colors block">support@fixflow.ma</a>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Product</p>
            <div className="space-y-2.5">
              {[["#features","Features"],["#how-it-works","How it works"],["#pricing","Pricing"],["#faq","FAQ"]].map(([href,label]) => (
                <a key={label} href={href} className="block text-sm text-slate-500 hover:text-white transition-colors">{label}</a>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Account</p>
            <div className="space-y-2.5">
              {[["/login","Sign in"],["/register","Start free trial"]].map(([href,label]) => (
                <Link key={label} href={href} className="block text-sm text-slate-500 hover:text-white transition-colors">{label}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Legal</p>
            <div className="space-y-2.5">
              {[["/terms","Terms of Service"],["/privacy","Privacy Policy"]].map(([href,label]) => (
                <Link key={label} href={href} className="block text-sm text-slate-500 hover:text-white transition-colors">{label}</Link>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 px-5 py-5 max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} FixFlow. All rights reserved.</p>
          <p className="text-xs text-slate-600">Made for repair shops 🔧</p>
        </div>
      </footer>
    </div>
  );
}
