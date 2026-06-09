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

const FREE_FEATURES = ["All core features", "Up to 50 work orders", "1 admin + 3 engineers", "Customer portal", "Email support"];
const PRO_FEATURES = ["Unlimited work orders", "Unlimited team members", "Advanced analytics", "Expense tracking", "Warranty tracking", "SMS notifications", "Priority support", "Custom shop branding"];

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-xl mx-auto lg:mx-0">
      <div className="absolute -inset-4 bg-blue-600/10 rounded-3xl blur-2xl" />
      <div className="relative bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl shadow-black/50">
        {/* Browser bar */}
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
        {/* App chrome */}
        <div className="flex h-56 sm:h-64">
          {/* Sidebar */}
          <div className="w-28 sm:w-36 bg-slate-900 border-r border-slate-800 p-2.5 flex-shrink-0">
            <div className="text-xs font-semibold text-white mb-3 px-2">FixFlow</div>
            {[["📋","Work Orders",true],["👤","Customers",false],["🔧","Parts",false],["📊","Analytics",false]].map(([icon,label,active]) => (
              <div key={label as string} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs mb-0.5 ${active ? "bg-blue-600 text-white" : "text-slate-500"}`}>
                <span className="text-sm">{icon}</span>
                <span className="truncate hidden sm:block">{label}</span>
              </div>
            ))}
          </div>
          {/* Content */}
          <div className="flex-1 p-3 space-y-2.5 overflow-hidden bg-slate-950/50">
            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-2">
              {[["Active","23","text-blue-400"],["Revenue","48.5k","text-emerald-400"],["Done","12","text-green-400"]].map(([l,v,c]) => (
                <div key={l} className="bg-slate-800/80 rounded-lg p-2">
                  <p className="text-slate-500 text-xs leading-none mb-1">{l}</p>
                  <p className={`font-bold text-sm ${c}`}>{v}</p>
                </div>
              ))}
            </div>
            {/* Table */}
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
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
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
            <a href="#pricing" onClick={() => setMenuOpen(false)} className="block text-sm text-slate-400 hover:text-white">Pricing</a>
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
            {/* Left */}
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
                <Link href="/login"
                  className="w-full sm:w-auto px-7 py-3 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium rounded-xl transition-colors text-base">
                  Sign In
                </Link>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-5 text-xs text-slate-600 pt-1">
                <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> 14-day free trial</span>
                <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> No credit card</span>
                <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> Cancel anytime</span>
              </div>
            </div>
            {/* Right — dashboard mockup */}
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

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-5 py-24 scroll-mt-16">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold">Simple, honest pricing</h2>
          <p className="text-slate-400 mt-3">Start free. Upgrade when your shop grows.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Trial */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col gap-6">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Free Trial</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-white">0</span>
                <span className="text-slate-400 mb-1">MAD / 14 days</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">Full access, no commitment</p>
            </div>
            <ul className="space-y-2.5 flex-1">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-slate-400">
                  <span className="text-emerald-400 flex-shrink-0">✓</span>{f}
                </li>
              ))}
            </ul>
            <Link href="/register"
              className="block w-full text-center py-3 border border-slate-700 hover:border-blue-500 hover:text-blue-400 text-slate-300 text-sm font-medium rounded-xl transition-colors">
              Start Free Trial
            </Link>
          </div>

          {/* Pro */}
          <div className="relative bg-gradient-to-b from-blue-950/60 to-slate-900 border border-blue-500/30 rounded-2xl p-8 flex flex-col gap-6 shadow-xl shadow-blue-950/20">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-blue-600 text-white text-xs px-4 py-1 rounded-full font-semibold tracking-wide">Most Popular</span>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Pro</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-white">299</span>
                <span className="text-slate-400 mb-1">MAD / month</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">For growing repair shops</p>
            </div>
            <ul className="space-y-2.5 flex-1">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <span className="text-emerald-400 flex-shrink-0">✓</span>{f}
                </li>
              ))}
            </ul>
            <a href="mailto:support@fixflow.ma"
              className="block w-full text-center py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/20">
              Get Pro →
            </a>
          </div>
        </div>
        <p className="text-center text-xs text-slate-600 mt-8">Questions? Email us at <a href="mailto:support@fixflow.ma" className="text-slate-400 hover:text-white transition-colors">support@fixflow.ma</a></p>
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
              {[["#features","Features"],["#how-it-works","How it works"],["#pricing","Pricing"]].map(([href,label]) => (
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
