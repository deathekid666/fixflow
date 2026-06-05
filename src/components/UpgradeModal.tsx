"use client";

type UpgradeModalProps = {
  onClose: () => void;
  feature: string;
  limit: number;
  current: number;
};

export default function UpgradeModal({ onClose, feature, limit, current }: UpgradeModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full space-y-5 text-center">
        <div className="text-5xl">🚀</div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Upgrade to PRO</h2>
          <p className="text-slate-400 text-sm">
            You've reached the FREE plan limit of <span className="text-white font-medium">{limit} {feature}</span>.
            You currently have <span className="text-white font-medium">{current}</span>.
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 text-left space-y-2">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">PRO includes:</p>
          {[
            "Unlimited work orders",
            "Unlimited engineers",
            "Unlimited spare parts",
            "Priority support",
            "Advanced analytics",
          ].map(f => (
            <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
              <span className="text-green-400">✓</span> {f}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <a href="mailto:support@fixflow.ma?subject=Upgrade to PRO"
            className="block w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors">
            Contact us to upgrade — 299 MAD/month
          </a>
          <button onClick={onClose}
            className="block w-full py-2 text-slate-500 hover:text-slate-300 text-sm transition-colors">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}