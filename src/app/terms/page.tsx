import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/" className="text-xl font-bold">FixFlow</Link>
        <Link href="/login" className="text-sm text-slate-400 hover:text-white">Sign in</Link>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-slate-400 text-sm">Last updated: June 2026</p>
        </div>
        {[
          { title: "1. Acceptance of Terms", content: "By accessing or using FixFlow, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service." },
          { title: "2. Service Description", content: "FixFlow is a cloud-based repair shop management platform that provides tools for managing work orders, customers, inventory, and payments." },
          { title: "3. Account Registration", content: "You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account credentials." },
          { title: "4. Free Trial", content: "New accounts receive a 14-day free trial with full access to all features. After the trial period, continued use requires an active paid subscription." },
          { title: "5. Payment & Billing", content: "Paid plans are billed monthly. You can upgrade or cancel your subscription at any time by contacting our support team." },
          { title: "6. Data & Privacy", content: "We take data privacy seriously. Your data is stored securely and never sold to third parties. See our Privacy Policy for full details." },
          { title: "7. Acceptable Use", content: "You agree not to use FixFlow for any unlawful purpose or in any way that could harm the service, other users, or third parties." },
          { title: "8. Termination", content: "We reserve the right to suspend or terminate accounts that violate these terms, with or without notice." },
          { title: "9. Contact", content: "For questions about these terms, contact us at support@fixflow.ma" },
        ].map(s => (
          <div key={s.title} className="space-y-2">
            <h2 className="text-lg font-semibold text-white">{s.title}</h2>
            <p className="text-slate-400 leading-relaxed">{s.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}