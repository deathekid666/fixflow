"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { CERT_CRITERIA, CERT_META } from "@/lib/certification";
import CertBadge from "@/components/CertBadge";

const CERT_CELEBRATED_KEY = "fixflow_cert_celebrated_";

type Stats = {
  totalCompleted: number;
  avgRating: number;
  bounceRate: number;
  currentLevel: "BRONZE" | "SILVER" | "GOLD" | null;
  earnedAt: string | null;
};

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function CriteriaRow({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${met ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-400"}`}>
        {met ? "✓" : "·"}
      </span>
      <span className={`text-sm ${met ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>{label}</span>
    </div>
  );
}

export default function CertificationPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!user?.shopId) return;
    fetch(`/api/certification/${user.shopId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setStats(d);
        setLoading(false);
        if (d.currentLevel && user?.id) {
          const key = `${CERT_CELEBRATED_KEY}${user.id}_${d.currentLevel}`;
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, "1");
            import("canvas-confetti").then(m => {
              const fire = m.default ?? m;
              fire({ particleCount: 120, spread: 80, origin: { y: 0.55 } });
              setTimeout(() => fire({ particleCount: 60, spread: 120, origin: { y: 0.4 }, angle: 60 }), 300);
              setTimeout(() => fire({ particleCount: 60, spread: 120, origin: { y: 0.4 }, angle: 120 }), 600);
            });
          }
        }
      })
      .catch(() => setLoading(false));
  }, [user?.shopId]);

  function downloadBadge() {
    const canvas = canvasRef.current;
    if (!canvas || !stats?.currentLevel) return;
    const level = stats.currentLevel;
    const meta = CERT_META[level];
    const ctx = canvas.getContext("2d")!;

    canvas.width = 400;
    canvas.height = 140;

    // Background
    ctx.fillStyle = meta.bg;
    ctx.roundRect(0, 0, 400, 140, 16);
    ctx.fill();

    // Border
    ctx.strokeStyle = meta.border;
    ctx.lineWidth = 3;
    ctx.roundRect(1.5, 1.5, 397, 137, 15);
    ctx.stroke();

    // Emoji
    ctx.font = "52px serif";
    ctx.textAlign = "center";
    ctx.fillText(meta.emoji, 70, 85);

    // Title
    ctx.fillStyle = meta.color;
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`${meta.label} Certified`, 130, 52);

    // Shop name
    ctx.font = "bold 16px Arial";
    ctx.fillStyle = meta.color;
    ctx.fillText(user?.shop?.name ?? "Repair Shop", 130, 80);

    // Subtitle
    ctx.font = "12px Arial";
    ctx.fillStyle = meta.color;
    ctx.globalAlpha = 0.7;
    ctx.fillText("Verified on FixFlow · fixflow.app/directory", 130, 108);
    ctx.globalAlpha = 1;

    // Download
    const link = document.createElement("a");
    link.download = `fixflow-${level.toLowerCase()}-badge.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  const nextLevel =
    stats?.currentLevel === "GOLD" ? null :
    stats?.currentLevel === "SILVER" ? "GOLD" :
    stats?.currentLevel === "BRONZE" ? "SILVER" : "BRONZE";

  const levels: Array<"BRONZE" | "SILVER" | "GOLD"> = ["BRONZE", "SILVER", "GOLD"];

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Shop Certification</h1>
        <p className="text-sm text-slate-500 mt-0.5">Automatically awarded based on repairs, ratings, and quality.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !stats ? (
        <p className="text-sm text-slate-500">Could not load certification data.</p>
      ) : (
        <>
          {/* Current status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            {stats.currentLevel ? (
              <div className="flex items-start gap-5">
                <div className="text-6xl">{CERT_META[stats.currentLevel].emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {CERT_META[stats.currentLevel].label} Certified
                    </h2>
                    <CertBadge level={stats.currentLevel} size="md" />
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {stats.earnedAt ? `Earned ${new Date(stats.earnedAt).toLocaleDateString()}` : "Active certification"}
                    {stats.currentLevel !== "GOLD" && nextLevel && ` · Work toward ${CERT_META[nextLevel].label} next`}
                  </p>
                  <button
                    onClick={downloadBadge}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors"
                  >
                    ⬇ Download Badge
                  </button>
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-5xl mb-3">🏆</div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No certification yet</h2>
                <p className="text-sm text-slate-500">Complete 10+ repairs with a 3.5+ avg rating to earn Bronze.</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Completed Repairs", value: stats.totalCompleted.toLocaleString(), icon: "✅" },
              { label: "Avg Rating", value: stats.avgRating > 0 ? `${stats.avgRating.toFixed(2)} ★` : "—", icon: "⭐" },
              { label: "Bounce Rate", value: `${stats.bounceRate.toFixed(1)}%`, icon: "↩" },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Level progress */}
          <div className="space-y-4">
            {levels.map((lvl) => {
              const crit = CERT_CRITERIA[lvl];
              const meta = CERT_META[lvl];
              const isEarned = stats.currentLevel === lvl ||
                (lvl === "BRONZE" && (stats.currentLevel === "SILVER" || stats.currentLevel === "GOLD")) ||
                (lvl === "SILVER" && stats.currentLevel === "GOLD");
              const isNext = lvl === nextLevel;

              const ordersOk = stats.totalCompleted >= crit.minOrders;
              const ratingOk = stats.avgRating >= crit.minRating;
              const bounceOk = crit.maxBounceRate === null || stats.bounceRate <= crit.maxBounceRate;

              return (
                <div key={lvl} className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 ${isNext ? "border-blue-400 dark:border-blue-600 ring-1 ring-blue-400/30" : "border-slate-200 dark:border-slate-800"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{meta.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{meta.label}</h3>
                          {isEarned && <CertBadge level={lvl} size="xs" showLabel={false} />}
                          {isNext && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">Next goal</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{crit.minOrders}+ repairs · {crit.minRating}+ rating{crit.maxBounceRate !== null ? ` · ≤${crit.maxBounceRate}% bounces` : ""}</p>
                      </div>
                    </div>
                    {isEarned && <span className="text-emerald-500 font-semibold text-sm">✓ Achieved</span>}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Completed repairs</span>
                        <span className={ordersOk ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}>{stats.totalCompleted} / {crit.minOrders}</span>
                      </div>
                      <ProgressBar value={stats.totalCompleted} max={crit.minOrders} color={ordersOk ? "#10b981" : meta.border} />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Avg rating</span>
                        <span className={ratingOk ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}>{stats.avgRating > 0 ? stats.avgRating.toFixed(2) : "—"} / {crit.minRating}</span>
                      </div>
                      <ProgressBar value={stats.avgRating} max={5} color={ratingOk ? "#10b981" : meta.border} />
                    </div>
                    {crit.maxBounceRate !== null && (
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Bounce rate (lower is better)</span>
                          <span className={bounceOk ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-red-500"}>{stats.bounceRate.toFixed(1)}% / ≤{crit.maxBounceRate}%</span>
                        </div>
                        <ProgressBar value={Math.max(0, crit.maxBounceRate - stats.bounceRate)} max={crit.maxBounceRate} color={bounceOk ? "#10b981" : "#ef4444"} />
                      </div>
                    )}
                    <div className="pt-2 space-y-1.5 border-t border-slate-100 dark:border-slate-800">
                      <CriteriaRow met={ordersOk} label={`${crit.minOrders}+ completed repairs`} />
                      <CriteriaRow met={ratingOk} label={`${crit.minRating}+ average rating`} />
                      {crit.maxBounceRate !== null && (
                        <CriteriaRow met={bounceOk} label={`Bounce rate under ${crit.maxBounceRate}%`} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-500">
              Certifications are calculated automatically every time a work order is marked as <strong className="text-slate-700 dark:text-slate-300">Done</strong> or <strong className="text-slate-700 dark:text-slate-300">Delivered</strong>.
              All certifications are free and permanent as long as your shop meets the criteria.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
