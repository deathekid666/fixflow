"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/currency";
import { useLanguage } from "@/context/LanguageContext";

type PriceStat = {
  repairType: string;
  count: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  avgPartsCost: number;
  avgMargin: number | null;
  acceptanceRate: number;
  recent: { price: number; date: string }[];
};

type PricingData = {
  stats: PriceStat[];
  underpriced: PriceStat[];
  mostProfitable: PriceStat[];
  leastProfitable: PriceStat[];
  raiseRecommended: PriceStat[];
  dropConsider: PriceStat[];
  total: number;
};

const CONFIDENCE_COLORS: Record<string, string> = {
  HIGH: "text-emerald-600 dark:text-emerald-400",
  MEDIUM: "text-yellow-600 dark:text-yellow-400",
  LOW: "text-red-600 dark:text-red-400",
};

const INPUT = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500";

export default function PricingPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const currency = user?.shop?.currency ?? "MAD";
  const fmt = (n: number) => formatCurrency(n, currency);

  const [data, setData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Manual entry form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ deviceBrand: "", deviceModel: "", repairType: "", price: "", partsCost: "", acceptedByCustomer: "true" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // View
  const [view, setView] = useState<"overview" | "analytics">("overview");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/pricing", { credentials: "include" });
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch { setError("Could not load pricing data"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleManualEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!form.repairType || !form.price) return;
    setSaving(true); setSaveMsg("");
    try {
      const res = await fetch("/api/pricing", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceBrand: form.deviceBrand,
          deviceModel: form.deviceModel,
          repairType: form.repairType,
          price: parseFloat(form.price),
          partsCost: parseFloat(form.partsCost || "0"),
          acceptedByCustomer: form.acceptedByCustomer === "true",
        }),
      });
      if (!res.ok) throw new Error();
      setSaveMsg("Entry saved!");
      setForm({ deviceBrand: "", deviceModel: "", repairType: "", price: "", partsCost: "", acceptedByCustomer: "true" });
      load();
      setTimeout(() => { setSaveMsg(""); setShowForm(false); }, 1500);
    } catch { setSaveMsg("Failed to save"); }
    finally { setSaving(false); }
  }

  const filtered = data?.stats.filter(s =>
    search === "" || s.repairType.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  function MarginBar({ margin }: { margin: number | null }) {
    if (margin === null) return <span className="text-slate-400 text-xs">—</span>;
    const color = margin >= 50 ? "bg-emerald-500" : margin >= 30 ? "bg-yellow-500" : margin >= 15 ? "bg-orange-400" : "bg-red-500";
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(margin, 100)}%` }} />
        </div>
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-9 text-right">{margin}%</span>
      </div>
    );
  }

  function AcceptanceBadge({ rate }: { rate: number }) {
    const color = rate >= 80 ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
      : rate >= 60 ? "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30"
      : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30";
    return <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${color}`}>{rate}%</span>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t("pricingEngine")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t("pricingSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors">
            {t("addHistoricalPrice")}
          </button>
        </div>
      </div>

      {/* Manual entry form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">{t("addHistoricalPricingEntry")}</h2>
          <form onSubmit={handleManualEntry} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Device Brand</label>
              <input className={INPUT} placeholder="e.g. Samsung" value={form.deviceBrand} onChange={e => setForm(f => ({ ...f, deviceBrand: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Device Model</label>
              <input className={INPUT} placeholder="e.g. Galaxy S22" value={form.deviceModel} onChange={e => setForm(f => ({ ...f, deviceModel: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Repair Type *</label>
              <input className={INPUT} placeholder="e.g. Screen Replacement" required value={form.repairType} onChange={e => setForm(f => ({ ...f, repairType: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t("priceCharged")} ({currency}) *</label>
              <input type="number" min="0" step="0.01" required className={INPUT} placeholder="0.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t("partsCost")} ({currency})</label>
              <input type="number" min="0" step="0.01" className={INPUT} placeholder="0.00" value={form.partsCost} onChange={e => setForm(f => ({ ...f, partsCost: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t("customerAccepted")}</label>
              <select className={INPUT} value={form.acceptedByCustomer} onChange={e => setForm(f => ({ ...f, acceptedByCustomer: e.target.value }))}>
                <option value="true">{t("yesOption")}</option>
                <option value="false">{t("noRejected")}</option>
              </select>
            </div>
            <div className="col-span-2 sm:col-span-3 flex items-center gap-3">
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
                {saving ? "Saving…" : t("saveEntry")}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">Cancel</button>
              {saveMsg && <span className={`text-sm ${saveMsg.startsWith("F") ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>{saveMsg}</span>}
            </div>
          </form>
        </div>
      )}

      {error && <div className="bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}

      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: t("repairTypesTracked"), value: data.stats.length, icon: "🔧" },
              { label: t("totalEntries"), value: data.total, icon: "📊" },
              { label: t("mostDone"), value: data.stats[0]?.repairType ?? "—", icon: "🏆", small: true },
              { label: t("underpricedRepairs"), value: data.underpriced.length, icon: "⚠", warn: data.underpriced.length > 0 },
            ].map((card, i) => (
              <div key={i} className={`bg-white dark:bg-slate-900 border rounded-xl p-4 ${card.warn ? "border-amber-300 dark:border-amber-700/50" : "border-slate-200 dark:border-slate-800"}`}>
                <p className="text-xs text-slate-500 mb-1">{card.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{card.icon}</span>
                  <p className={`font-bold text-slate-900 dark:text-white ${card.small ? "text-sm" : "text-xl"} ${card.warn ? "text-amber-600 dark:text-amber-400" : ""}`}>
                    {card.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl p-1 w-fit">
            {(["overview", "analytics"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  view === v ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}>
                {v === "overview" ? t("allRepairTypes") : t("analyticsTab")}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {view === "overview" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <input className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder={t("searchRepairType")} value={search} onChange={e => setSearch(e.target.value)} />
                <span className="text-xs text-slate-400 flex-shrink-0">{filtered.length} {t("typesLabel")}</span>
              </div>

              {filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-3xl mb-2">💰</p>
                  <p className="text-sm text-slate-500">{t("noPricingDataYet")}</p>
                  <p className="text-xs text-slate-400 mt-1">{t("pricingAutoSaved")}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map(s => (
                    <div key={s.repairType} className="px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.repairType}</p>
                            <span className="text-xs text-slate-400">{s.count} repair{s.count !== 1 ? "s" : ""}</span>
                            <AcceptanceBadge rate={s.acceptanceRate} />
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-xs">
                            <div>
                              <p className="text-slate-400 mb-0.5">{t("minLabel")}</p>
                              <p className="font-medium text-slate-700 dark:text-slate-300">{fmt(s.minPrice)}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 mb-0.5">{t("averageLabel")}</p>
                              <p className="font-bold text-slate-900 dark:text-white">{fmt(s.avgPrice)}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 mb-0.5">{t("maxLabel")}</p>
                              <p className="font-medium text-slate-700 dark:text-slate-300">{fmt(s.maxPrice)}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-slate-400 mb-1">{t("marginLabel")}</p>
                              <MarginBar margin={s.avgMargin} />
                            </div>
                          </div>
                          {/* Trend sparkline */}
                          {s.recent.length > 1 && (
                            <div className="mt-2 flex items-end gap-0.5 h-6">
                              {s.recent.map((r, i) => {
                                const max = Math.max(...s.recent.map(x => x.price));
                                const min = Math.min(...s.recent.map(x => x.price));
                                const range = max - min || 1;
                                const pct = Math.round(((r.price - min) / range) * 100);
                                return (
                                  <div key={i} title={`${fmt(r.price)}`}
                                    className="flex-1 bg-blue-400 dark:bg-blue-600 rounded-t opacity-70 hover:opacity-100 transition-opacity"
                                    style={{ height: `${Math.max(pct, 10)}%` }} />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics tab */}
          {view === "analytics" && (
            <div className="space-y-5">
              {/* Most profitable */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🏆</span>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("mostProfitable")}</h2>
                </div>
                {data.mostProfitable.length === 0 ? <p className="text-sm text-slate-400">{t("notEnoughData")}</p> : (
                  <div className="space-y-3">
                    {data.mostProfitable.map(s => (
                      <div key={s.repairType} className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{s.repairType}</p>
                          <p className="text-xs text-slate-400">Avg {fmt(s.avgPrice)} · {s.count} done</p>
                        </div>
                        <div className="w-32 flex-shrink-0">
                          <MarginBar margin={s.avgMargin} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Least profitable */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">📉</span>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("leastProfitable")}</h2>
                </div>
                <p className="text-xs text-slate-400 mb-4">{t("leastProfitableHint")}</p>
                {data.leastProfitable.length === 0 ? <p className="text-sm text-slate-400">{t("notEnoughData")}</p> : (
                  <div className="space-y-3">
                    {data.leastProfitable.map(s => (
                      <div key={s.repairType} className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{s.repairType}</p>
                          <p className="text-xs text-slate-400">Avg {fmt(s.avgPrice)} · parts avg {fmt(s.avgPartsCost)}</p>
                        </div>
                        <div className="w-32 flex-shrink-0">
                          <MarginBar margin={s.avgMargin} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Underpriced */}
              {data.underpriced.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">⚠</span>
                    <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-300">{t("underpricedTitle")}</h2>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">{t("underpricedHint")}</p>
                  <div className="space-y-2">
                    {data.underpriced.map(s => (
                      <div key={s.repairType} className="flex items-center justify-between">
                        <p className="text-sm text-amber-800 dark:text-amber-200">{s.repairType}</p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-amber-600 dark:text-amber-400">Avg price: {fmt(s.avgPrice)}</span>
                          <span className="text-amber-500">Margin: {s.avgMargin}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raise recommended */}
              {data.raiseRecommended.length > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📈</span>
                    <h2 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t("raiseTitle")}</h2>
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-4">{t("raiseHint")}</p>
                  <div className="space-y-2">
                    {data.raiseRecommended.map(s => (
                      <div key={s.repairType} className="flex items-center justify-between">
                        <p className="text-sm text-emerald-800 dark:text-emerald-200">{s.repairType}</p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-emerald-600 dark:text-emerald-400">Avg: {fmt(s.avgPrice)}</span>
                          <AcceptanceBadge rate={s.acceptanceRate} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drop consideration */}
              {data.dropConsider.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🚫</span>
                    <h2 className="text-sm font-semibold text-red-700 dark:text-red-300">{t("dropTitle")}</h2>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400 mb-4">{t("dropHint")}</p>
                  <div className="space-y-2">
                    {data.dropConsider.map(s => (
                      <div key={s.repairType} className="flex items-center justify-between">
                        <p className="text-sm text-red-800 dark:text-red-200">{s.repairType}</p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-red-500 dark:text-red-400">Avg: {fmt(s.avgPrice)}</span>
                          <AcceptanceBadge rate={s.acceptanceRate} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.mostProfitable.length === 0 && data.underpriced.length === 0 && data.raiseRecommended.length === 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-16 text-center">
                  <p className="text-3xl mb-3">📊</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("notEnoughDataFull")}</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">{t("notEnoughDataDesc")}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
