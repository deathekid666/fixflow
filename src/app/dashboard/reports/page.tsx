"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/currency";
import { REFERRAL_LABELS, REFERRAL_BADGE_CLASS } from "@/lib/referralSources";

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

const ACCT_DATE_INPUT = "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500";

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

  // Accounting export
  const thisYear = new Date().getFullYear();
  const [acctFrom, setAcctFrom] = useState(`${thisYear}-01-01`);
  const [acctTo, setAcctTo] = useState(new Date().toISOString().slice(0, 10));
  const [exporting, setExporting] = useState<string | null>(null);

  function downloadAccounting(type: "quickbooks" | "xero" | "all-transactions") {
    setExporting(type);
    const params = new URLSearchParams({ type });
    if (acctFrom) params.set("from", acctFrom);
    if (acctTo)   params.set("to", acctTo);
    const a = document.createElement("a");
    a.href = `/api/export?${params}`;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setExporting(null), 1500);
  }
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

            {/* ── Referral Source Report ── */}
            <ReferralReport fmt={fmt} currency={currency} />

            {/* ── Accounting Export ── */}
            <div className="no-print pt-2 border-t border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Accounting Export</h2>
              <p className="text-sm text-slate-500 mb-5">Export payments, expenses, and commissions for your accounting software. Includes tax breakdown per transaction.</p>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5">
                {/* Date range */}
                <div className="flex gap-3 items-end flex-wrap">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">From</label>
                    <input type="date" value={acctFrom} onChange={e => setAcctFrom(e.target.value)} className={ACCT_DATE_INPUT} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">To</label>
                    <input type="date" value={acctTo} onChange={e => setAcctTo(e.target.value)} className={ACCT_DATE_INPUT} />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: "This month", from: `${thisYear}-${String(new Date().getMonth()+1).padStart(2,"0")}-01`, to: new Date().toISOString().slice(0,10) },
                      { label: "This year",  from: `${thisYear}-01-01`, to: new Date().toISOString().slice(0,10) },
                      { label: "Last year",  from: `${thisYear-1}-01-01`, to: `${thisYear-1}-12-31` },
                    ].map(p => (
                      <button key={p.label} onClick={() => { setAcctFrom(p.from); setAcctTo(p.to); }}
                        className="px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* QuickBooks */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🟢</span>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">QuickBooks</p>
                    </div>
                    <p className="text-xs text-slate-500">Date, Type, Num, Name, Description, Amount, Tax, Total</p>
                    <button onClick={() => downloadAccounting("quickbooks")} disabled={exporting === "quickbooks"}
                      className="w-full py-2 text-xs font-semibold bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5">
                      {exporting === "quickbooks" ? "Preparing…" : "⬇ Export for QuickBooks"}
                    </button>
                  </div>

                  {/* Xero */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔵</span>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Xero</p>
                    </div>
                    <p className="text-xs text-slate-500">ContactName, InvoiceNumber, InvoiceDate, DueDate, Description, Quantity, UnitAmount, TaxType, AccountCode</p>
                    <button onClick={() => downloadAccounting("xero")} disabled={exporting === "xero"}
                      className="w-full py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5">
                      {exporting === "xero" ? "Preparing…" : "⬇ Export for Xero"}
                    </button>
                  </div>

                  {/* All Transactions */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📊</span>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">All Transactions</p>
                    </div>
                    <p className="text-xs text-slate-500">Date, Type, Reference, Party, Description, NetAmount, TaxAmount, GrossAmount, Method, Currency</p>
                    <button onClick={() => downloadAccounting("all-transactions")} disabled={exporting === "all-transactions"}
                      className="w-full py-2 text-xs font-semibold bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5">
                      {exporting === "all-transactions" ? "Preparing…" : "⬇ Export All Transactions"}
                    </button>
                  </div>
                </div>

                {/* Legend */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500">
                  <p><span className="font-medium text-slate-700 dark:text-slate-300">Payments</span> — work order payments collected, with tax split</p>
                  <p><span className="font-medium text-slate-700 dark:text-slate-300">Expenses</span> — all recorded shop expenses</p>
                  <p><span className="font-medium text-slate-700 dark:text-slate-300">Commissions</span> — engineer commission payouts</p>
                </div>
              </div>
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

function ReferralReport({ fmt, currency }: { fmt: (n: number) => string; currency: string }) {
  type ReferralRow = { source: string; count: number; revenue: number; quotedRevenue: number; avgOrderValue: number };
  type ReferralData = { rows: ReferralRow[]; totalOrders: number; totalRevenue: number };

  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const INPUT = "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500";

  async function load() {
    setLoading(true);
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    const res = await fetch(`/api/reports/referrals?${p}`, { credentials: "include" });
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const hasData = data && data.rows.filter(r => r.source !== "UNKNOWN").length > 0;

  return (
    <div className="no-print pt-2 border-t border-slate-200 dark:border-slate-800">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Referral Sources</h2>
      <p className="text-sm text-slate-500 mb-4">Which channels bring the most customers and revenue.</p>

      <div className="flex gap-3 items-end flex-wrap mb-4">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className={INPUT} />
        </div>
        <button onClick={load} disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors">
          {loading ? "Loading..." : "Apply"}
        </button>
        {(from || to) && (
          <button onClick={() => { setFrom(""); setTo(""); setTimeout(load, 0); }}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-lg transition-colors">
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 py-4">Loading...</p>
      ) : !hasData ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center">
          <p className="text-slate-400 text-sm">No referral source data yet. Start selecting a source when creating work orders.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Source</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Orders</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Share</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Revenue ({currency})</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Avg Order</th>
              </tr>
            </thead>
            <tbody>
              {data!.rows.filter(r => r.source !== "UNKNOWN").map((r, i) => (
                <tr key={r.source} className="border-b border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REFERRAL_BADGE_CLASS[r.source] ?? "bg-slate-100 text-slate-600"}`}>
                      {REFERRAL_LABELS[r.source] ?? r.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-900 dark:text-white font-semibold">{r.count}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden w-16">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${data!.totalOrders > 0 ? Math.round((r.count / data!.totalOrders) * 100) : 0}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{data!.totalOrders > 0 ? Math.round((r.count / data!.totalOrders) * 100) : 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-green-600 dark:text-green-400 font-medium">{fmt(r.revenue)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmt(r.avgOrderValue)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 dark:bg-slate-800/30">
                <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-xs">TOTAL</td>
                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{data!.totalOrders}</td>
                <td className="px-4 py-3 text-xs text-slate-500">100%</td>
                <td className="px-4 py-3 font-bold text-green-600 dark:text-green-400">{fmt(data!.totalRevenue)}</td>
                <td className="px-4 py-3 text-slate-500">{data!.totalOrders > 0 ? fmt(data!.totalRevenue / data!.totalOrders) : "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
