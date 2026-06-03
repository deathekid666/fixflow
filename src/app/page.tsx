import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="text-xl font-bold">FixFlow</div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Sign in</Link>
          <Link href="/register" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-sm font-medium rounded-lg transition-colors">
            Start Free Trial
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-3 py-1.5 rounded-full mb-4">
          🔧 Built for repair shops in Morocco
        </div>
        <h1 className="text-5xl font-bold leading-tight">
          The CRM built for<br />
          <span className="text-blue-400">repair shops</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Manage work orders, track repairs, collect payments, and grow your repair business — all in one place.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link href="/register"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors text-lg">
            Start Free Trial →
          </Link>
          <Link href="/login" className="px-8 py-3 border border-slate-700 hover:border-slate-500 text-slate-300 font-medium rounded-xl transition-colors text-lg">
            Sign In
          </Link>
        </div>
        <p className="text-xs text-slate-600">14-day free trial · No credit card required</p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">Everything your repair shop needs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "📋", title: "Work Order Management", desc: "Create, track and manage repair orders from intake to delivery. Never lose track of a device again." },
            { icon: "👤", title: "Customer Portal", desc: "Customers track their repair online with a QR code. Reduce calls and improve satisfaction." },
            { icon: "💰", title: "Payment Tracking", desc: "Track cash, card and bank transfers. Know exactly who paid and what's outstanding." },
            { icon: "🔧", title: "Spare Parts Inventory", desc: "Manage your parts catalog, track stock levels and get low stock alerts automatically." },
            { icon: "📊", title: "Analytics & Reports", desc: "Revenue charts, engineer performance, top parts used. Make data-driven decisions." },
            { icon: "📱", title: "Mobile Friendly", desc: "Works on any device. Manage your shop from your phone while on the go." },
            { icon: "🗂️", title: "Repair Templates", desc: "Create templates for common repairs. Auto-fill parts, services and prices in seconds." },
            { icon: "✅", title: "Diagnosis Checklist", desc: "Standard checklist for every device. Protect against customer disputes with documented checks." },
            { icon: "📷", title: "Device Photos", desc: "Photo documentation at intake, during repair and at completion. Full visual audit trail." },
          ].map(f => (
            <div key={f.title} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 hover:border-slate-700 transition-colors">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-4">Simple pricing</h2>
        <p className="text-slate-400 text-center mb-12">Start free, upgrade when you're ready</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free trial */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="font-bold text-white text-lg">Free Trial</h3>
              <p className="text-slate-400 text-sm mt-1">14 days, full access</p>
            </div>
            <div className="text-3xl font-bold text-white">0 MAD</div>
            <div className="space-y-2">
              {["All features included", "Up to 50 work orders", "1 admin + 3 engineers", "Email support"].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="text-green-400">✓</span> {f}
                </div>
              ))}
            </div>
            <Link href="/register"
              className="block w-full text-center py-2.5 border border-slate-700 hover:border-slate-500 text-slate-300 text-sm font-medium rounded-lg transition-colors">
              Start Free Trial
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-6 space-y-4 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">Most Popular</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Pro</h3>
              <p className="text-slate-400 text-sm mt-1">For growing repair shops</p>
            </div>
            <div>
              <span className="text-3xl font-bold text-white">299 MAD</span>
              <span className="text-slate-400 text-sm">/month</span>
            </div>
            <div className="space-y-2">
              {["Unlimited work orders", "Unlimited team members", "Advanced analytics", "Priority support", "Custom branding", "SMS notifications"].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="text-green-400">✓</span> {f}
                </div>
              ))}
            </div>
            <a href="mailto:support@fixflow.ma"
              className="block w-full text-center py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
              Contact Us to Upgrade
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center space-y-6">
        <h2 className="text-3xl font-bold">Ready to grow your repair shop?</h2>
        <p className="text-slate-400">Join repair shops already using FixFlow to manage their business.</p>
        <Link href="/register"
          className="inline-block px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors text-lg">
          Start Your Free Trial →
        </Link>
        <p className="text-xs text-slate-600">No credit card required · Cancel anytime</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-8 max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="font-bold text-white">FixFlow</div>
          <p className="text-xs text-slate-500 mt-1">Repair shop management made simple</p>
        </div>
        <div className="flex items-center gap-6 text-xs text-slate-500">
          <a href="mailto:support@fixflow.ma" className="hover:text-slate-300 transition-colors">support@fixflow.ma</a>
          <Link href="/login" className="hover:text-slate-300 transition-colors">Sign in</Link>
          <Link href="/register" className="hover:text-slate-300 transition-colors">Register</Link>
        </div>
      </footer>
    </div>
  );
}