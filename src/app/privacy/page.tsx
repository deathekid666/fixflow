import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/" className="text-xl font-bold">FixFlow</Link>
        <Link href="/login" className="text-sm text-slate-400 hover:text-white">Sign in</Link>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-slate-400 text-sm">Last updated: June 2026</p>
        </div>
        {[
          { title: "1. Information We Collect", content: "We collect information you provide when registering (name, email, shop details) and data generated through your use of the service (work orders, customer data, payments)." },
          { title: "2. How We Use Your Information", content: "We use your information to provide and improve our service, send transactional emails, and communicate important updates about your account." },
          { title: "3. Data Storage", content: "Your data is stored securely on servers in the United States. We use industry-standard encryption to protect your data in transit and at rest." },
          { title: "4. Data Sharing", content: "We do not sell, trade, or share your personal information with third parties except as required by law or to provide the service (e.g., email delivery)." },
          { title: "5. Customer Data", content: "Data you enter about your customers belongs to you. We process it only to provide the service and do not use it for any other purpose." },
          { title: "6. Cookies", content: "We use essential cookies for authentication and session management. We do not use tracking or advertising cookies." },
          { title: "7. Data Retention", content: "We retain your data for as long as your account is active. You can request deletion of your data by contacting support." },
          { title: "8. Your Rights", content: "You have the right to access, correct, or delete your personal data at any time. Contact us at support@fixflow.ma to exercise these rights." },
          { title: "9. Contact", content: "For privacy questions, contact us at support@fixflow.ma" },
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