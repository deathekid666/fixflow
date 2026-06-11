"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/currency";

type MonthRow = { label: string; total: number; collected: number; expenses: number; profit: number; count: number };

type UsageItem = {
  sparePartId: string;
  _sum: { quantity: number; total: number };
  _count: { id: number };
  part: { name: string; partNumber: string; unitPrice: number; stock: number } | null;
};

type Adjustment = {
  id: string; quantity: number; type: string; reason: string | null;
  createdAt: string; user: { name: string }; sparePart: { name: string; partNumber: string };
};

type PartsData = { usage: UsageItem[]; totals: { totalQuantity: number; totalRevenue: number }; adjustments: Adjustment[] };

const TYPE_COLORS: Record<string, string> = {
  ADD: "text-green-600 dark:text-green-400", REMOVE: "text-red-600 dark:text-red-400", CORRECTION: "text-yellow-600 dark:text-yellow-400",
};

function monthLabel(iso: string) {
  const [y, m] = iso.split("-");
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });
}

export default function ReportsPage() {
  const { user } = useAuth();
  const currency = user?.shop?.currency ?? "MAD";
  const fmt = (n: number) => formatCurrency(n, currency, 0);
  const [months, setMonths] = useState<MonthRow[]>([]);
  const [parts, setParts] = useState<PartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [partsFrom, setPartsFrom] = useState("");
  const [partsTo, setPartsTo] = useState("");
  const [partsLoading, setPartsLoading] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [revRes, partsRes] = await Promise.all([
      fetch("/api/reports/revenue?period=monthly&range=all", { credentials: "include" }),
      fetch("/api/reports/parts", { credentials: "include" }),
    ]);
    const [revData, partsData] = await Promise.all([revRes.json(), partsRes.json()]);
    setMonths(Array.isArray(revData.data) ? revData.data : []);
    setParts(partsData);
    setLoading(false);
  }

  async function loadParts() {
    setPartsLoading(true);
    const params = new URLSearchParams();
    if (partsFrom) params.set("from", partsFrom);
    if (partsTo) params.set("to", partsTo);
    const res = await fetch(`/api/reports/parts?${params}`, { credentials: "include" });
    setParts(await res.json());
    setPartsLoading(false);
  }

  const years = [...new Set(months.map(m => m.label.slice(0, 4)))].sort().reverse();
  if (years.length && !years.includes(year)) setYear(years[0]);

  const filtered = months.filter(m => m.label.startsWith(year)).reverse();

  const ys = {
    revenue: filtered.reduce((s, m) => s + m.total, 0),
    collected: filtered.reduce((s, m) => s + m.collected, 0),
    expenses: filtered.reduce((s, m) => s + m.expenses, 0),
    profit: filtered.reduce((s, m) => s + m.profit, 0),
    orders: filtered.reduce((s, m) => s + m.count, 0),
  };
  const collectionRate = ys.revenue > 0 ? Math.round((ys.collected / ys.revenue) * 100) : 0;

  return (
    <>
      <style>{`
        @media print {
          aside, header, nav { display: none !important; }
          body { background: white !important; color: #0f172a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-section { page-break-inside: avoid; }
          .print-card { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; }
          .print-row-alt:nth-child(even) { background: #f8fafc !important; }
          th, td { color: #0f172a !important; border-color: #e2e8f0 !important; }
          .print-header { display: flex !important; }
        }
        .print-header { display: none; }
      `}</style>

      <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">

        {/* Print-only header */}
        <div className="print-header items-center justify-between mb-6">
          <div>
            <p className="text-xl font-bold text-slate-900">FixFlow — Monthly Report</p>
            <p className="text-sm text-slate-500">Year: {year} · Generated {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Page header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Reports</h1>
            <p className="text-sm text-slate-500 mt-0.5">Monthly revenue, expenses, and profit summary</p>
          </div>
          <button
            onClick={() => window.print()}
            className="no-print flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Export PDF
          </button>
        </div>

        {loading ? (
          <p className="text-slate-500 text-sm py-10 text-center">Loading report...</p>
        ) : (
          <>
            {/* Year tabs */}
            {years.length > 0 && (
              <div className="flex gap-2 flex-wrap no-print">
                {years.map(y => (
                  <button key={y} onClick={() => setYear(y)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${year === y ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>
                    {y}
                  </button>
                ))}
              </div>
            )}

            {/* KPI summary for year */}
            <div className="print-section">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{year} Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Revenue", value: fmt(ys.revenue), color: "text-slate-900 dark:text-white", sub: `${ys.orders} orders` },
                  { label: "Collected", value: fmt(ys.collected), color: "text-green-600 dark:text-green-400", sub: `${collectionRate}% rate` },
                  { label: "Outstanding", value: fmt(ys.revenue - ys.collected), color: ys.revenue - ys.collected > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-slate-500", sub: "uncollected" },
                  { label: "Expenses", value: fmt(ys.expenses), color: "text-red-600 dark:text-red-400", sub: "total costs" },
                  { label: "Net Profit", value: fmt(ys.profit), color: ys.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400", sub: ys.collected > 0 ? `${Math.round((ys.profit / ys.collected) * 100)}% margin` : "" },
                  { label: "Orders", value: ys.orders.toString(), color: "text-blue-600 dark:text-blue-400", sub: `avg ${ys.orders > 0 ? fmt(ys.revenue / ys.orders) : "0"}` },
                ].map(s => (
                  <div key={s.label} className="print-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                    <p className={`text-lg font-bold leading-tight ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly breakdown table */}
            <div className="print-section bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden print-card">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Month-by-Month Breakdown — {year}</h2>
              </div>
              {filtered.length === 0 ? (
                <p className="px-5 py-8 text-sm text-slate-500">No data for {year}.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        {["Month", "Orders", `Revenue (${currency})`, `Collected (${currency})`, "Coll. Rate", `Expenses (${currency})`, `Net Profit (${currency})`].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((m, i) => {
                        const rate = m.total > 0 ? Math.round((m.collected / m.total) * 100) : 0;
                        const isLastRow = i === filtered.length - 1;
                        return (
                          <tr key={m.label} className={`print-row-alt border-b border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors`}>
                            <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{monthLabel(m.label)}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{m.count}</td>
                            <td className="px-4 py-3 text-slate-900 dark:text-white">{fmt(m.total)}</td>
                            <td className="px-4 py-3 text-green-600 dark:text-green-400">{fmt(m.collected)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-14 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                  <div className={`h-full rounded-full ${rate >= 80 ? "bg-green-500" : rate >= 50 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${rate}%` }} />
                                </div>
                                <span className={`text-xs font-medium ${rate >= 80 ? "text-green-600 dark:text-green-400" : rate >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>{rate}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-red-600 dark:text-red-400">{fmt(m.expenses)}</td>
                            <td className={`px-4 py-3 font-semibold ${m.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{fmt(m.profit)}</td>
                          </tr>
                        );
                      })}
                      {/* Totals row */}
                      <tr className="bg-slate-100 dark:bg-slate-800/40 border-t-2 border-slate-300 dark:border-slate-700">
                        <td className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</td>
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-semibold">{ys.orders}</td>
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-semibold">{fmt(ys.revenue)}</td>
                        <td className="px-4 py-3 text-green-600 dark:text-green-400 font-semibold">{fmt(ys.collected)}</td>
                        <td className="px-4 py-3 text-xs font-semibold">{collectionRate}%</td>
                        <td className="px-4 py-3 text-red-600 dark:text-red-400 font-semibold">{fmt(ys.expenses)}</td>
                        <td className={`px-4 py-3 font-bold ${ys.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{fmt(ys.profit)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Parts section ── */}
            <div className="no-print">
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Parts Report</h2>
              </div>

              {/* Date filter */}
              <div className="flex gap-3 items-end flex-wrap mb-5">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">From</label>
                  <input type="date" value={partsFrom} onChange={e => setPartsFrom(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">To</label>
                  <input type="date" value={partsTo} onChange={e => setPartsTo(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
                <button onClick={loadParts} disabled={partsLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors">
                  {partsLoading ? "Loading..." : "Apply"}
                </button>
                {(partsFrom || partsTo) && (
                  <button onClick={() => { setPartsFrom(""); setPartsTo(""); setTimeout(loadParts, 0); }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-lg transition-colors">
                    Clear
                  </button>
                )}
              </div>

              {parts && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                      <p className="text-xs text-slate-500">Total Parts Used</p>
                      <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">{parts.totals.totalQuantity}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                      <p className="text-xs text-slate-500">Parts Revenue</p>
                      <p className="text-2xl font-semibold text-green-600 dark:text-green-400 mt-1">{fmt(parts.totals.totalRevenue)}</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Parts Consumption</h3>
                    {parts.usage.length === 0 ? (
                      <p className="text-sm text-slate-500">No data for this period.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800">
                              {["Part", "Part #", "Times Used", "Qty", "Revenue", "Stock"].map(h => (
                                <th key={h} className="text-left pb-2 px-1 text-xs text-slate-500">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {parts.usage.map(u => (
                              <tr key={u.sparePartId} className="border-b border-slate-200/50 dark:border-slate-800/50">
                                <td className="py-2 px-1 text-slate-900 dark:text-white font-medium">{u.part?.name ?? "—"}</td>
                                <td className="py-2 px-1 font-mono text-xs text-slate-400">{u.part?.partNumber ?? "—"}</td>
                                <td className="py-2 px-1 text-slate-600 dark:text-slate-300">{u._count.id}</td>
                                <td className="py-2 px-1 text-slate-600 dark:text-slate-300">{u._sum.quantity}</td>
                                <td className="py-2 px-1 text-slate-900 dark:text-white font-medium">{fmt(u._sum.total ?? 0)}</td>
                                <td className="py-2 px-1">
                                  <span className={`font-medium ${(u.part?.stock ?? 0) === 0 ? "text-red-600 dark:text-red-400" : (u.part?.stock ?? 0) < 5 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}>
                                    {u.part?.stock ?? 0}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Stock Adjustment History</h3>
                    {parts.adjustments.length === 0 ? (
                      <p className="text-sm text-slate-500">No adjustments recorded.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800">
                              {["Part", "Type", "Qty", "Reason", "By", "Date"].map(h => (
                                <th key={h} className="text-left pb-2 px-1 text-xs text-slate-500">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {parts.adjustments.map(a => (
                              <tr key={a.id} className="border-b border-slate-200/50 dark:border-slate-800/50">
                                <td className="py-2 px-1 text-slate-900 dark:text-white">{a.sparePart.name}</td>
                                <td className="py-2 px-1"><span className={`font-medium text-xs ${TYPE_COLORS[a.type]}`}>{a.type}</span></td>
                                <td className="py-2 px-1 text-slate-600 dark:text-slate-300">{a.quantity}</td>
                                <td className="py-2 px-1 text-slate-400 text-xs">{a.reason || "—"}</td>
                                <td className="py-2 px-1 text-slate-400">{a.user.name}</td>
                                <td className="py-2 px-1 text-slate-500 text-xs">{new Date(a.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
