export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">📧</div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            We sent a verification link to your email address. Click the link to activate your account.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-left space-y-2 text-sm text-slate-400">
          <p>✉️ Check your inbox and spam folder</p>
          <p>⏰ The link expires in 24 hours</p>
          <p>🔧 After verifying you can access your dashboard</p>
        </div>
        <a href="/login" className="inline-block text-xs text-slate-500 hover:text-slate-300 transition-colors">
          ← Back to login
        </a>
      </div>
    </div>
  );
}