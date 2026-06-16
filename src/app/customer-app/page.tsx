import Link from "next/link";

const FEATURES = [
  {
    icon: "📱",
    title: "All Your Repairs, One Place",
    desc: "Every device you've ever taken to a FixFlow shop — phone, tablet, laptop — visible in one clean list.",
  },
  {
    icon: "🔴",
    title: "Live Status Updates",
    desc: "See exactly where your repair stands: Received, Diagnosing, Repairing, Ready for Pickup, or Delivered.",
  },
  {
    icon: "📸",
    title: "Before & After Photos",
    desc: "View the intake and completion photos your technician took, right on your phone.",
  },
  {
    icon: "🛡️",
    title: "Warranty Tracking",
    desc: "Know which of your repairs are still under warranty and when each one expires.",
  },
  {
    icon: "💬",
    title: "Chat With the Shop",
    desc: "Send a message to the repair shop directly from the tracking page — no need to call.",
  },
  {
    icon: "📲",
    title: "Install on Your Phone",
    desc: "Add it to your home screen for instant access. Works offline too — no internet? No problem.",
  },
];

const STEPS = [
  { num: "1", title: "Open the app", desc: "Go to fixflow.app/customer-app/my-repairs or tap the link in your repair notification." },
  { num: "2", title: "Enter your phone number", desc: "The same number you gave to the repair shop. No password, no account needed." },
  { num: "3", title: "See all your repairs", desc: "Every repair across every FixFlow shop you've visited, with live status and photos." },
];

export default function CustomerLandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight">FixFlow</span>
            <span className="text-xs bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">For Customers</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/customer-app/my-repairs" className="text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors">
              Track Your Repairs
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(59,130,246,0.18),transparent)]" />
        <div className="relative max-w-3xl mx-auto px-5 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-3.5 py-1.5 rounded-full font-medium mb-6">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Free for all customers
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-5">
            Your repairs.<br />
            <span className="text-blue-400">Anywhere, anytime.</span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-xl mx-auto mb-10">
            Track every device repair from every FixFlow shop you've visited — no account, no password. Just your phone number.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/customer-app/my-repairs"
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-base transition-colors shadow-lg shadow-blue-600/25"
            >
              Track My Repairs →
            </Link>
            <span className="text-sm text-slate-500">No sign-up required</span>
          </div>

          {/* Phone mockup */}
          <div className="mt-16 mx-auto max-w-[280px]">
            <div className="bg-slate-900 rounded-[2.5rem] border border-slate-700 p-3 shadow-2xl shadow-blue-900/20">
              <div className="bg-slate-950 rounded-[2rem] overflow-hidden">
                {/* Status bar */}
                <div className="bg-slate-950 px-5 pt-3 pb-1 flex justify-between text-xs text-slate-500">
                  <span>9:41</span><span>●●●</span>
                </div>
                {/* App content preview */}
                <div className="px-4 pb-4 pt-2 space-y-2.5">
                  <div className="text-xs font-semibold text-slate-300 mb-3">My Repairs · 3 orders</div>
                  {[
                    { device: "iPhone 14 Pro", shop: "ElectroFix", status: "DONE", color: "bg-emerald-500" },
                    { device: "Samsung S23", shop: "TechRepair", status: "REPAIRING", color: "bg-orange-500" },
                    { device: "MacBook Air", shop: "iRepair", status: "DELIVERED", color: "bg-slate-500" },
                  ].map((r, i) => (
                    <div key={i} className="bg-slate-900/80 rounded-xl p-3 flex items-center gap-2.5 border border-slate-800">
                      <div className={`w-2 h-10 rounded-full flex-shrink-0 ${r.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{r.device}</div>
                        <div className="text-[10px] text-slate-500">{r.shop}</div>
                      </div>
                      <div className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full text-white ${r.color}`}>
                        {r.status === "DONE" ? "Ready" : r.status === "REPAIRING" ? "Repairing" : "Done"}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Bottom nav preview */}
                <div className="border-t border-slate-800 px-4 py-2 flex justify-around">
                  {["🔧", "📅", "⚙️"].map((icon, i) => (
                    <div key={i} className={`text-base ${i === 0 ? "opacity-100" : "opacity-40"}`}>{icon}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-5 py-20">
        <h2 className="text-2xl font-bold text-center mb-3">Everything you need to track your repairs</h2>
        <p className="text-slate-400 text-center mb-12">One app. Every shop. All your repairs.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-3xl mx-auto px-5 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3">How it works</h2>
        <p className="text-slate-400 mb-12">Three steps. No account needed.</p>
        <div className="space-y-5">
          {STEPS.map((s) => (
            <div key={s.num} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-start gap-5 text-left">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-lg">
                {s.num}
              </div>
              <div>
                <div className="font-semibold text-white mb-1">{s.title}</div>
                <div className="text-sm text-slate-400">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-5 py-16 text-center">
        <div className="bg-gradient-to-br from-blue-900/50 to-slate-900 border border-blue-800/40 rounded-3xl p-10">
          <div className="text-4xl mb-4">📱</div>
          <h2 className="text-2xl font-bold mb-3">Ready to track your repairs?</h2>
          <p className="text-slate-400 mb-8">Enter your phone number and see all your repair history in seconds.</p>
          <Link
            href="/customer-app/my-repairs"
            className="inline-block px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-base transition-colors"
          >
            Open My Repairs →
          </Link>
          <p className="text-xs text-slate-600 mt-4">Works on any phone · No download required · Installable as an app</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-300 transition-colors">FixFlow</Link>
        <span className="mx-2">·</span>
        <Link href="/customer-app/my-repairs" className="hover:text-slate-300 transition-colors">Track Repairs</Link>
        <span className="mx-2">·</span>
        <Link href="/login" className="hover:text-slate-300 transition-colors">Shop Login</Link>
      </footer>
    </div>
  );
}
