import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-8xl font-bold text-slate-800">404</div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
          <p className="text-slate-400 text-sm">The page you're looking for doesn't exist or has been moved.</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
            Go to Dashboard
          </Link>
          <Link href="/" className="px-6 py-2.5 border border-slate-700 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}