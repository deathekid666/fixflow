"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/currency";
import { useLanguage } from "@/context/LanguageContext";

type CommissionRow = {
  userId: string;
  name: string;
  email: string;
  role: string;
  commissionRate: number;
  totalOrders: number;
  totalRevenue: number;
  commissionAmount: number;
  locked: {
    totalOrders: number;
    totalRevenue: number;
    commissionRate: number;
    commissionAmount: number;
  } | null;
};

function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });
}

function monthOptions() {
  const opts: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return opts;
}

export default function CommissionsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const currency = user?.shop?.currency ?? "MAD";
  const fmt = (n: number) => formatCurrency(n, currency);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [month, setMonth] = useState(currentMonth);
  const [rows, setRows] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<Record<string, string>>({});
  const [savingRate, setSavingRate] = useState<string | null>(null);
  const [locking, setLocking] = useState(false);
  const [lockMsg, setLockMsg] = useState("");

  useEffect(() => { load(); }, [month]);

  async function load() {
    setLoading(true);
    setLockMsg("");
    const res = await fetch(`/api/engineers/commissions?month=${month}`, { credentials: "include" });
    if (res.ok) {
      const data: CommissionRow[] = await res.json();
      setRows(data);
      const r: Record<string, string> = {};
      data.forEach(d => { r[d.userId] = d.commissionRate.toString(); });
      setRates(r);
    }
    setLoading(false);
  }

  async function saveRate(userId: string) {
    const rate = parseFloat(rates[userId] ?? "0");
    if (isNaN(rate) || rate < 0 || rate > 100) return;
    setSavingRate(userId);
    const eng = rows.find(r => r.userId === userId);
    if (!eng) { setSavingRate(null); return; }
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: eng.name, email: eng.email, commissionRate: rate }),
    });
    setSavingRate(null);
    await load();
  }

  async function lockMonth() {
    setLocking(true); setLockMsg("");
    const payload = rows.map(r => ({
      userId: r.userId,
      totalOrders: r.totalOrders,
      totalRevenue: r.totalRevenue,
      commissionRate: r.commissionRate,
      commissionAmount: r.commissionAmount,
    }));
    const res = await fetch("/api/engineers/commissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ month, rows: payload }),
    });
    setLockMsg(res.ok ? t("commissionSaved") : t("commissionFailed"));
    setLocking(false);
    await load();
  }

  const totalOrders = rows.reduce((s, r) => s + r.totalOrders, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.totalRevenue, 0);
  const totalCommission = rows.reduce((s, r) => s + r.commissionAmount, 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/engineers" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm">← {t("engineers")}</Link>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t("engineerCommissions")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t("commissionsSubtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          >
            {monthOptions().map(m => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
          <button onClick={lockMonth} disabled={locking || rows.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors">
            {locking ? t("saving") : t("saveSnapshot")}
          </button>
        </div>
      </div>

      {lockMsg && (
        <div className={`text-sm px-4 py-3 rounded-lg border ${lockMsg.includes("Failed") ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400" : "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"}`}>
          {lockMsg}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t("kpiTotalOrders"), value: totalOrders, color: "text-slate-900 dark:text-white", icon: "📋" },
          { label: t("totalRevenue"), value: fmt(totalRevenue), color: "text-emerald-600 dark:text-emerald-400", icon: "💰" },
          { label: t("totalCommissions"), value: fmt(totalCommission), color: "text-blue-600 dark:text-blue-400", icon: "💸" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">{s.label}</p>
              <span>{s.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{monthLabel(month)}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              {[t("engineerCol"), t("roleCol"), t("ordersCol"), t("revenueCol"), t("commissionRate"), t("commissionAmount"), t("lockedCol")].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && [...Array(3)].map((_, i) => (
              <tr key={i} className="border-b border-slate-200/50 dark:border-slate-800/50 animate-pulse">
                {[...Array(7)].map((__, j) => (
                  <td key={j} className="px-4 py-3.5"><div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20" /></td>
                ))}
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">{t("noEngineersFoundComm")}</td></tr>
            )}
            {!loading && rows.map(r => (
              <tr key={r.userId} className="border-b border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="font-medium text-slate-900 dark:text-white">{r.name}</p>
                  <p className="text-xs text-slate-400">{r.email}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.role === "ADMIN" ? "bg-purple-500/20 text-purple-600 dark:text-purple-400" : "bg-blue-500/20 text-blue-600 dark:text-blue-400"}`}>
                    {r.role}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">{r.totalOrders}</td>
                <td className="px-4 py-3.5 text-emerald-600 dark:text-emerald-400 font-medium">{fmt(r.totalRevenue)}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={rates[r.userId] ?? r.commissionRate}
                        onChange={e => setRates(prev => ({ ...prev, [r.userId]: e.target.value }))}
                        className="w-14 bg-transparent px-2 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none tabular-nums"
                      />
                      <span className="text-xs text-slate-400 pr-2">%</span>
                    </div>
                    <button
                      onClick={() => saveRate(r.userId)}
                      disabled={savingRate === r.userId}
                      className="px-2 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors">
                      {savingRate === r.userId ? "..." : "Set"}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`font-bold text-sm ${r.commissionAmount > 0 ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
                    {fmt(r.commissionAmount)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {r.locked ? (
                    <div>
                      <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">{t("savedLabel")}</span>
                      <p className="text-xs text-slate-400 mt-0.5">{fmt(r.locked.commissionAmount)} @ {r.locked.commissionRate}%</p>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          {!loading && rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-sm" colSpan={2}>{t("totalRow")}</td>
                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{totalOrders}</td>
                <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{fmt(totalRevenue)}</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400">{fmt(totalCommission)}</td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="text-xs text-slate-400">
        {t("commissionFormula")} <span className="font-mono">revenue × rate ÷ 100</span> {t("commissionFormulaDetail")} {monthLabel(month)}.{" "}
        {t("useSnapshotHint")}
      </p>
    </div>
  );
}
