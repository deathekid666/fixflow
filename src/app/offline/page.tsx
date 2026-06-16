"use client";
export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
      <div className="space-y-4">
        <div className="text-5xl">📡</div>
        <h1 className="text-xl font-bold text-white">You&apos;re offline</h1>
        <p className="text-slate-400 text-sm max-w-xs">
          No internet connection. Previously viewed pages are still available — reconnect to sync latest data.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
