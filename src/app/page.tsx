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

type ComparisonRow = { feature: string; free: boolean | string; pro: boolean | string };
const COMPARISON: ComparisonRow[] = [
  { feature: "Work orders",           free: "Up to 50 / month",     pro: "Unlimited" },
  { feature: "Team members",          free: "1 admin + 3 engineers", pro: "Unlimited" },
  { feature: "Customer portal",       free: true,  pro: true },
  { feature: "Spare parts inventory", free: true,  pro: true },
  { feature: "Repair templates",      free: true,  pro: true },
  { feature: "Diagnosis checklists",  free: true,  pro: true },
  { feature: "Basic analytics",       free: true,  pro: true },
  { feature: "Advanced analytics",    free: false, pro: true },
  { feature: "Expense tracking",      free: false, pro: true },
  { feature: "Warranty tracking",     free: false, pro: true },
  { feature: "SMS notifications",     free: false, pro: true },
  { feature: "Custom shop branding",  free: false, pro: true },
  { feature: "Support",               free: "Email", pro: "Priority" },
];

const FAQS = [
  {
    q: "Is there a free trial?",
    a: "Yes — every new shop gets 14 days of full access with no credit card required. You can explore every feature and decide if FixFlow is right for you before committing to anything.",
  },
  {
    q: "Can I use it on mobile?",
    a: "Absolutely. FixFlow is fully responsive and works great on any phone or tablet. You can also install it as a PWA directly from your browser for a native app experience, including offline support when your connection drops.",
  },
  {
    q: "How many users can I add?",
    a: "The Free Trial supports 1 admin and up to 3 engineers. The Pro plan includes unlimited team members — add as many technicians as your shop needs at no extra cost per seat.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted in transit (HTTPS) and at rest. Authentication uses signed JWT tokens, and each shop's data is completely isolated — no other shop can ever access your information.",
  },
];

function Check({ pro }: { pro?: boolean }) {
  return <span className={`text-lg ${pro ? "text-emerald-400" : "text-emerald-500"}`}>✓</span>;
}
function Dash() {
  return <span className="text-slate-700 text-lg">—</span>;
}

function CellValue({ val, pro }: { val: boolean | string; pro?: boolean }) {
  if (typeof val === "boolean") return val ? <Check pro={pro} /> : <Dash />;
  return <span className={`text-sm ${pro ? "text-blue-300" : "text-slate-400"}`}>{val}</span>;
}

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-xl mx-auto lg:mx-0">
      <div className="absolute -inset-4 bg-blue-600/10 rounded-3xl blur-2xl" />
      <div className="relative bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl shadow-black/50">
        <div className="bg-slate-800/80 px-4 py-2.5 flex items-center gap-2 border-b border-slate-700">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
          </div>
          <div className="flex-1 mx-3 bg-slate-700/60 rounded-md h-5 flex items-center px-2.5">
            <span className="text-slate-500 text-xs">fixflow.app/dashboard</span>
          </div>
        </div>
        <div className="flex h-56 sm:h-64">
          <div className="w-28 sm:w-36 bg-slate-900 border-r border-slate-800 p-2.5 flex-shrink-0">
            <div className="text-xs font-semibold text-white mb-3 px-2">FixFlow</div>
            {[["📋","Work Orders",true],["👤","Customers",false],["🔧","Parts",false],["📊","Analytics",false]].map(([icon,label,active]) => (
              <div key={label as string} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs mb-0.5 ${active ? "bg-blue-600 text-white" : "text-slate-500"}`}>
                <span className="text-sm">{icon}</span>
                <span className="truncate hidden sm:block">{label}</span>
              </div>
            ))}
          </div>
          <div className="flex-1 p-3 space-y-2.5 overflow-hidden bg-slate-950/50">
            <div className="grid grid-cols-3 gap-2">
              {[["Active","23","text-blue-400"],["Revenue","48.5k","text-emerald-400"],["Done","12","text-green-400"]].map(([l,v,c]) => (
                <div key={l} className="bg-slate-800/80 rounded-lg p-2">
                  <p className="text-slate-500 text-xs leading-none mb-1">{l}</p>
                  <p className={`font-bold text-sm ${c}`}>{v}</p>
                </div>
              ))}
            </div>
            <div className="bg-slate-800/60 rounded-xl overflow-hidden">
              <div className="grid grid-cols-3 gap-2 px-3 py-1.5 border-b border-slate-700">
                {["Order #","Customer","Status"].map(h => <span key={h} className="text-slate-500 text-xs">{h}</span>)}
              </div>
              {[
                ["WO-0091","Ahmed K.","REPAIRING","text-orange-400"],
                ["WO-0090","Sara M.","DONE","text-green-400"],
                ["WO-0089","Karim B.","RECEIVED","text-blue-400"],
                ["WO-0088","Nadia R.","DELIVERED","text-slate-400"],
              ].map(([num,name,status,color]) => (
                <div key={num} className="grid grid-cols-3 gap-2 px-3 py-1.5 border-b border-slate-800/50">
                  <span className="font-mono text-xs text-slate-400">{num}</span>
                  <span className="text-xs text-white truncate">{name}</span>
                  <span className={`text-xs font-medium ${color}`}>{status}</span>
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
      <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white tracking-tight">FixFlow</span>
            <span className="hidden sm:block text-xs bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">Beta</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#demo" className="hover:text-white transition-colors">Demo</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5">Sign in</Link>
            <Link href="/register" className="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors">
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
            <a href="#features" onClick={() => setMenuOpen(false)} className="block text-sm text-slate-400 hover:text-white">Features</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="block text-sm text-slate-400 hover:text-white">How it works</a>
            <a href="#demo" onClick={() => setMenuOpen(false)} className="block text-sm text-slate-400 hover:text-white">Demo</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)} className="block text-sm text-slate-400 hover:text-white">Pricing</a>
            <a href="#faq" onClick={() => setMenuOpen(false)} className="block text-sm text-slate-400 hover:text-white">FAQ</a>
            <div className="flex gap-3 pt-2 border-t border-slate-800">
              <Link href="/login" className="flex-1 text-center text-sm text-slate-300 border border-slate-700 py-2 rounded-lg hover:border-slate-500 transition-colors">Sign in</Link>
              <Link href="/register" className="flex-1 text-center text-sm font-medium bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-500 transition-colors">Free Trial</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.12),transparent)]" />
        <div className="relative max-w-6xl mx-auto px-5 pt-20 pb-24 lg:pt-28">
          <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-10">
            <div className="flex-1 text-center lg:text-left space-y-6 max-w-xl mx-auto lg:mx-0">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                Built for repair shops
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold leading-[1.15] tracking-tight">
                The repair shop OS<br />
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">built to scale</span>
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed">
                Manage work orders, track repairs, collect payments, and grow your repair business — all in one place.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <Link href="/register"
                  className="w-full sm:w-auto px-7 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors text-base shadow-lg shadow-blue-600/20">
                  Start Free Trial →
                </Link>
                <a href="#demo"
                  className="w-full sm:w-auto px-7 py-3 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium rounded-xl transition-colors text-base flex items-center justify-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs">▶</span>
                  Watch demo
                </a>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-5 text-xs text-slate-600 pt-1">
                <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> 14-day free trial</span>
                <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> No credit card</span>
                <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> Cancel anytime</span>
              </div>
            </div>
            <div className="flex-1 w-full">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="border-y border-slate-800 bg-slate-900/40">
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

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-5 py-24 scroll-mt-16">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold">Everything your shop needs</h2>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">One platform to replace the spreadsheets, WhatsApp notes, and paper receipts.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 space-y-3 transition-all hover:bg-slate-900/80">
              <div className="w-10 h-10 bg-slate-800 group-hover:bg-slate-700 rounded-xl flex items-center justify-center text-xl transition-colors">
                {f.icon}
              </div>
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-slate-900/30 border-y border-slate-800 scroll-mt-16">
        <div className="max-w-5xl mx-auto px-5 py-24">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Up and running in minutes</h2>
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

      {/* Demo video */}
      <section id="demo" className="max-w-5xl mx-auto px-5 py-24 scroll-mt-16">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">Demo</p>
          <h2 className="text-3xl sm:text-4xl font-bold">See FixFlow in action</h2>
          <p className="text-slate-400 mt-3">Watch how a repair shop handles a full day end-to-end.</p>
        </div>
        <div className="relative group cursor-pointer rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl shadow-black/60 aspect-video bg-slate-950">
          {/* Layered background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/50" />
          {/* Faint grid */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
          {/* Fake UI chrome in background */}
          <div className="absolute inset-8 opacity-[0.07] rounded-xl border border-white overflow-hidden">
            <div className="h-6 bg-white/20 border-b border-white/10 flex items-center px-3 gap-1.5">
              <div className="w-2 h-2 rounded-full bg-white/40" />
              <div className="w-2 h-2 rounded-full bg-white/40" />
              <div className="w-2 h-2 rounded-full bg-white/40" />
            </div>
          </div>
          {/* Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(59,130,246,0.08),transparent)]" />
          {/* Overlay darkens on hover */}
          <div className="absolute inset-0 bg-slate-950/50 group-hover:bg-slate-950/30 transition-colors duration-300" />
          {/* Play button + label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
            <div className="w-20 h-20 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-500 group-hover:scale-110 transition-all duration-200 shadow-2xl shadow-black/40">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-base">Watch 2-min demo</p>
              <p className="text-slate-500 text-sm mt-1">No sign-up required</p>
            </div>
          </div>
          {/* Duration badge */}
          <div className="absolute bottom-4 right-4 text-xs text-slate-400 bg-slate-900/80 backdrop-blur px-2 py-1 rounded font-mono border border-slate-700/50">2:14</div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-slate-900/30 border-y border-slate-800 scroll-mt-16">
        <div className="max-w-4xl mx-auto px-5 py-24">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Simple, honest pricing</h2>
            <p className="text-slate-400 mt-3">Start free. Upgrade when your shop grows.</p>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[520px]">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_160px_180px] border border-slate-800 rounded-t-2xl overflow-hidden">
                {/* Empty feature col */}
                <div className="bg-slate-900/60 px-6 py-6 border-r border-slate-800" />

                {/* Free Trial */}
                <div className="bg-slate-900/60 px-6 py-6 text-center border-r border-slate-800">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Free Trial</p>
                  <p className="text-3xl font-bold text-white leading-none">0</p>
                  <p className="text-slate-500 text-xs mt-1">MAD · 14 days</p>
                  <Link href="/register"
                    className="mt-5 block w-full text-center py-2 border border-slate-700 hover:border-blue-500 hover:text-blue-400 text-slate-300 text-xs font-semibold rounded-lg transition-colors">
                    Start Free Trial
                  </Link>
                </div>

                {/* Pro */}
                <div className="relative bg-blue-950/30 px-6 py-6 text-center">
                  <div className="absolute -top-px left-0 right-0 h-0.5 bg-blue-500" />
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-bold tracking-wide shadow-lg shadow-blue-600/30">
                      Most Popular
                    </span>
                  </div>
                  <p className="text-xs text-blue-400 uppercase tracking-wider font-semibold mb-3">Pro</p>
                  <p className="text-3xl font-bold text-white leading-none">299</p>
                  <p className="text-slate-400 text-xs mt-1">MAD / month</p>
                  <a href="mailto:support@fixflow.ma"
                    className="mt-5 block w-full text-center py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-md shadow-blue-600/20">
                    Get Pro →
                  </a>
                </div>
              </div>

              {/* Feature rows */}
              <div className="border-x border-b border-slate-800 rounded-b-2xl overflow-hidden divide-y divide-slate-800/70">
                {COMPARISON.map((row, i) => (
                  <div key={row.feature} className={`grid grid-cols-[1fr_160px_180px] ${i % 2 === 1 ? "bg-slate-900/20" : ""}`}>
                    <div className="px-6 py-3.5 text-sm text-slate-400 border-r border-slate-800">
                      {row.feature}
                    </div>
                    <div className="px-6 py-3.5 text-center border-r border-slate-800">
                      <CellValue val={row.free} />
                    </div>
                    <div className="px-6 py-3.5 text-center bg-blue-950/10">
                      <CellValue val={row.pro} pro />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-600 mt-8">
            Questions? Email us at{" "}
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
          <p className="text-slate-400 mt-3">Can't find what you're looking for? Email us at <a href="mailto:support@fixflow.ma" className="text-blue-400 hover:text-blue-300 transition-colors">support@fixflow.ma</a></p>
        </div>
        <div className="space-y-2">
          {FAQS.map((faq, i) => {
            const open = faqOpen === i;
            return (
              <div key={i} className={`border rounded-xl overflow-hidden transition-colors ${open ? "border-slate-700 bg-slate-900/50" : "border-slate-800 hover:border-slate-700"}`}>
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
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800">
        <div className="max-w-3xl mx-auto px-5 py-24 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to run a smarter shop?</h2>
          <p className="text-slate-400 text-lg">Join repair shops already using FixFlow to manage their operations.</p>
          <Link href="/register"
            className="inline-block px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors text-lg shadow-xl shadow-blue-600/20">
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
              {[["#features","Features"],["#how-it-works","How it works"],["#demo","Demo"],["#pricing","Pricing"],["#faq","FAQ"]].map(([href,label]) => (
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
