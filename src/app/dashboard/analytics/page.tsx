"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  BarChart, Bar,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/currency";
import { PageHeader } from "@/components/PageHeader";
import { REFERRAL_LABELS, REFERRAL_CHART_COLORS } from "@/lib/referralSources";
import { CopilotPanel } from "@/components/CopilotPanel";

type RevenueData = {
  data: { label: string; total: number; collected: number; count: number; expenses: number; profit: number }[];
  summary: { totalRevenue: number; totalCollected: number; totalOrders: number; avgOrderValue: number; totalExpenses: number; profit: number };
};

type MonthStats = {
  orders: number; revenue: number; collected: number;
  expenses: number; collectionRate: number; profit: number;
};
type Comparison = { thisMonth: MonthStats; lastMonth: MonthStats };

type Analytics = {
  orders: { total: number; received: number; diagnosing: number; repairing: number; done: number; delivered: number; cancelled: number };
  revenue: { total: number; collected: number; outstanding: number };
  topParts: { sparePartId: string; _sum: { quantity: number; total: number }; part: { name: string; partNumber: string } }[];
  engineerStats: { id: string; name: string; completed: number; total: number; bounces: number; avgTat: number }[];
  lowStock: { id: string; name: string; partNumber: string; stock: number; unitPrice: number }[];
  sla: { total: number; met: number; breached: number; compliance: number | null };
  milestones: { anniversaryThisMonth: number; tenPlusCustomers: number; goldCustomers: number };
  referralStats?: { source: string; count: number; revenue: number }[];
};

type BenchmarkMetrics = {
  avgTat: number; avgOrderValue: number; bounceRate: number;
  collectionRate: number; returnRate: number; totalOrders: number;
};
type BenchmarkData = {
  shop: BenchmarkMetrics;
  industry: BenchmarkMetrics & { totalShops: number; hasEnoughData: boolean };
  insights: {
    topDevices: { brand: string; count: number }[];
    commonFaults: { label: string; count: number }[];
    avgPrices: { service: string; avgPrice: number; count: number }[];
    month: string;
  };
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function downloadChartSVG(containerId: string, filename: string) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const svg = container.querySelector("svg");
  if (!svg) return;
  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("width", "100%");
  bg.setAttribute("height", "100%");
  bg.setAttribute("fill", "#0f172a");
  clone.insertBefore(bg, clone.firstChild);
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const currency = user?.shop?.currency ?? "MAD";
  const fmt = (n: number) => formatCurrency(n, currency);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [period, setPeriod] = useState("monthly");
  const [dateRange, setDateRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"overview" | "benchmarks" | "copilot">("overview");
  const [benchmarks, setBenchmarks] = useState<BenchmarkData | null>(null);
  const [benchmarksLoading, setBenchmarksLoading] = useState(false);
  const [benchmarksError, setBenchmarksError] = useState("");
  const [copilotAnalysis, setCopilotAnalysis] = useState<string | null>(null);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotError, setCopilotError] = useState<string | null>(null);

  useEffect(() => { loadAll(); }, [period, dateRange]);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [a, r, c] = await Promise.all([
        fetch(`/api/analytics?range=${dateRange}`, { credentials: "include" }).then(x => { if (!x.ok) throw new Error(); return x.json(); }),
        fetch(`/api/reports/revenue?period=${period}&range=${dateRange}`, { credentials: "include" }).then(x => { if (!x.ok) throw new Error(); return x.json(); }),
        fetch(`/api/analytics/comparison`, { credentials: "include" }).then(x => x.ok ? x.json() : null),
      ]);
      setAnalytics(a);
      setRevenue(r);
      setComparison(c);
    } catch {
      setError("Could not load analytics. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCopilot() {
    setCopilotLoading(true); setCopilotError(null);
    try {
      const res = await fetch("/api/ai/revenue-copilot", { method: "POST", credentials: "include" });
      const d = await res.json();
      if (!res.ok) { setCopilotError(d.error ?? "Failed to generate analysis"); return; }
      setCopilotAnalysis(d.analysis);
    } catch { setCopilotError("Could not reach AI — check your connection"); }
    finally { setCopilotLoading(false); }
  }

  async function loadBenchmarks() {
    if (benchmarks) return;
    setBenchmarksLoading(true);
    setBenchmarksError("");
    try {
      const res = await fetch("/api/benchmarks", { credentials: "include" });
      if (!res.ok) throw new Error();
      setBenchmarks(await res.json());
    } catch {
      setBenchmarksError("Could not load benchmark data. Please try again.");
    } finally {
      setBenchmarksLoading(false);
    }
  }

  function exportCSV(type: string) {
    window.open(`/api/export?type=${type}`, "_blank");
  }

  function exportAnalyticsCSV() {
    if (!revenue) return;
    const s = revenue.summary;
    const rows = [
      ["Analytics Export", `Range: ${dateRange}`, `Period: ${period}`],
      [],
      ["Summary"],
      ["Total Orders", s.totalOrders],
      [`Total Revenue (${currency})`, s.totalRevenue.toFixed(2)],
      [`Total Collected (${currency})`, s.totalCollected.toFixed(2)],
      [`Total Expenses (${currency})`, s.totalExpenses.toFixed(2)],
      [`Net Profit (${currency})`, s.profit.toFixed(2)],
      [`Avg Order Value (${currency})`, s.avgOrderValue.toFixed(2)],
      [],
      [`Period`, `Revenue (${currency})`, `Collected (${currency})`, `Expenses (${currency})`, `Profit (${currency})`, "Orders"],
      ...revenue.data.map(d => [d.label, d.total.toFixed(2), d.collected.toFixed(2), d.expenses.toFixed(2), d.profit.toFixed(2), d.count]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading && tab === "overview") return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <style>{`@keyframes skeleton-pulse { 0% { opacity: 0.4 } 50% { opacity: 0.8 } 100% { opacity: 0.4 } }`}</style>
      <div className="h-7 w-40 bg-slate-200 dark:bg-slate-800 rounded" style={{ animation: "skeleton-pulse 1.5s ease-in-out infinite" }} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2"
            style={{ animation: "skeleton-pulse 1.5s ease-in-out infinite" }}>
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 h-64"
          style={{ animation: "skeleton-pulse 1.5s ease-in-out infinite" }}>
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
          <div className="h-44 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
        </div>
      ))}
    </div>
  );
  if (error && tab === "overview") return (
    <div className="p-6 max-w-7xl mx-auto">
      <div style={{
        textAlign: "center", padding: "60px 20px",
        background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)",
        borderRadius: 16, margin: "20px 0",
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <p style={{ color: "#f87171", fontWeight: 600, fontSize: 16, margin: "0 0 6px" }}>Something went wrong</p>
        <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 20px" }}>{error}</p>
        <button onClick={() => loadAll()} style={{
          background: "#2563eb", color: "white", border: "none", borderRadius: 8,
          padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>
          Try again
        </button>
      </div>
    </div>
  );

  const outstanding = revenue ? revenue.summary.totalRevenue - revenue.summary.totalCollected : 0;
  const collectionRate = revenue && revenue.summary.totalRevenue > 0
    ? Math.round((revenue.summary.totalCollected / revenue.summary.totalRevenue) * 100)
    : 0;

  const pieData = analytics ? [
    { name: "Received", value: analytics.orders.received },
    { name: "Diagnosing", value: analytics.orders.diagnosing },
    { name: "Repairing", value: analytics.orders.repairing },
    { name: "Done", value: analytics.orders.done },
    { name: "Delivered", value: analytics.orders.delivered },
    { name: "Cancelled", value: analytics.orders.cancelled },
  ].filter(d => d.value > 0) : [];

  const activeOrders = analytics ? analytics.orders.received + analytics.orders.diagnosing + analytics.orders.repairing + analytics.orders.done : 0;
  const profitMargin = revenue && revenue.summary.totalCollected > 0
    ? Math.round((revenue.summary.profit / revenue.summary.totalCollected) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="Analytics" subtitle="Revenue, expenses, profit and insights" />
        {tab === "overview" && (
        <div className="flex gap-2 flex-wrap">
          {["7d", "30d", "90d", "all"].map(r => (
            <button key={r} onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${dateRange === r ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>
              {r === "7d" ? "7 days" : r === "30d" ? "30 days" : r === "90d" ? "90 days" : "All time"}
            </button>
          ))}
          <div className="w-px bg-slate-300 dark:bg-slate-700 mx-1" />
          <button onClick={exportAnalyticsCSV} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition-colors">⬇ Analytics CSV</button>
          <button onClick={() => exportCSV("workorders")} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition-colors">⬇ Orders</button>
          <button onClick={() => exportCSV("customers")} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition-colors">⬇ Customers</button>
          <button onClick={() => exportCSV("parts")} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition-colors">⬇ Parts</button>
        </div>
        )}
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {([["overview", "📊 Overview"], ["benchmarks", "🏆 Benchmarks"], ["copilot", "✨ Copilot"]] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              if (id === "benchmarks") loadBenchmarks();
              if (id === "copilot" && !copilotAnalysis && !copilotLoading) loadCopilot();
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === id ? "border-violet-600 text-violet-600 dark:text-violet-400" : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
          >{label}</button>
        ))}
      </div>

      {/* ── Overview tab ──────────────────────────────────────────────────── */}
      {tab === "overview" && analytics && revenue && <>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Orders", value: revenue.summary.totalOrders, sub: `${activeOrders} active`, color: "text-slate-900 dark:text-white", icon: "📋", bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "Revenue", value: formatCurrency(revenue.summary.totalRevenue, currency, 0), sub: `Avg: ${formatCurrency(revenue.summary.avgOrderValue, currency, 0)}`, color: "text-slate-900 dark:text-white", icon: "💰", bg: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" },
          { label: "Collected", value: formatCurrency(revenue.summary.totalCollected, currency, 0), sub: `${collectionRate}% rate`, color: "text-green-600 dark:text-green-400", icon: "✅", bg: "bg-green-500/10 border-green-500/20" },
          { label: "Expenses", value: formatCurrency(revenue.summary.totalExpenses, currency, 0), sub: "Total costs", color: "text-red-600 dark:text-red-400", icon: "💸", bg: "bg-red-500/10 border-red-500/20" },
          { label: "Net Profit", value: formatCurrency(revenue.summary.profit, currency, 0), sub: `${profitMargin}% margin`, color: revenue.summary.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400", icon: revenue.summary.profit >= 0 ? "📈" : "📉", bg: revenue.summary.profit >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20" },
          { label: "Outstanding", value: formatCurrency(outstanding, currency, 0), sub: `${100 - collectionRate}% unpaid`, color: outstanding > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-slate-500", icon: "⏳", bg: outstanding > 0 ? "bg-yellow-500/10 border-yellow-500/20" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-4 ${s.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">{s.label}</p>
              <span className="text-base">{s.icon}</span>
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Month-over-month comparison */}
      {comparison && (() => {
        const { thisMonth: tm, lastMonth: lm } = comparison;

        function delta(curr: number, prev: number) {
          if (prev === 0) return curr > 0 ? 100 : 0;
          return Math.round(((curr - prev) / prev) * 100);
        }

        function DeltaBadge({ curr, prev, invert = false }: { curr: number; prev: number; invert?: boolean }) {
          const pct = delta(curr, prev);
          const positive = invert ? pct < 0 : pct >= 0;
          if (curr === 0 && prev === 0) return <span className="text-xs text-slate-400">—</span>;
          return (
            <span className={`text-xs font-medium ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {pct >= 0 ? "▲" : "▼"} {Math.abs(pct)}%
            </span>
          );
        }

        const now = new Date();
        const thisMonthName = now.toLocaleString("default", { month: "long" });
        const lastMonthName = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString("default", { month: "long" });

        const metrics = [
          {
            label: "Revenue",
            icon: "💰",
            curr: tm.revenue, prev: lm.revenue,
            fmt: (v: number) => formatCurrency(v, currency, 0),
            invert: false,
          },
          {
            label: "Orders",
            icon: "📋",
            curr: tm.orders, prev: lm.orders,
            fmt: (v: number) => v.toString(),
            invert: false,
          },
          {
            label: "Collection Rate",
            icon: "✅",
            curr: tm.collectionRate, prev: lm.collectionRate,
            fmt: (v: number) => `${v}%`,
            invert: false,
          },
          {
            label: "Expenses",
            icon: "💸",
            curr: tm.expenses, prev: lm.expenses,
            fmt: (v: number) => formatCurrency(v, currency, 0),
            invert: true,
          },
          {
            label: "Net Profit",
            icon: tm.profit >= 0 ? "📈" : "📉",
            curr: tm.profit, prev: lm.profit,
            fmt: (v: number) => formatCurrency(v, currency, 0),
            invert: false,
          },
        ];

        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Month-over-Month</h2>
                <p className="text-xs text-slate-500 mt-0.5">{thisMonthName} vs {lastMonthName}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {metrics.map(m => (
                <div key={m.label} className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{m.label}</span>
                    <span className="text-sm">{m.icon}</span>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${m.label === "Net Profit" ? (m.curr >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400") : m.label === "Expenses" ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>
                      {m.fmt(m.curr)}
                    </p>
                    <DeltaBadge curr={m.curr} prev={m.prev} invert={m.invert} />
                  </div>
                  <div className="pt-1 border-t border-slate-200 dark:border-slate-700/50">
                    <p className="text-xs text-slate-500">{lastMonthName.slice(0, 3)}: <span className="text-slate-400">{m.fmt(m.prev)}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Revenue vs Expenses vs Profit chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Revenue, Expenses & Profit</h2>
            <p className="text-xs text-slate-500 mt-0.5">Billed vs collected vs expenses vs net profit</p>
          </div>
          <div className="flex gap-2">
            {["daily", "weekly", "monthly"].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${period === p ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
            <button onClick={() => downloadChartSVG("chart-revenue", `revenue-${dateRange}.svg`)}
              title="Download chart as SVG"
              className="px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              ⬇
            </button>
          </div>
        </div>
        {revenue.data.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No data yet.</p>
        ) : (
          <div id="chart-revenue" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <div style={{ minWidth: 500 }}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenue.data}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Area type="monotone" dataKey="total" name="Billed" stroke="#3b82f6" fill="url(#totalGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="collected" name="Collected" stroke="#10b981" fill="url(#collectedGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" fill="url(#expensesGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="#34d399" fill="url(#profitGrad)" strokeWidth={2} strokeDasharray="5 3" />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Orders volume + Status breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Work Orders Volume</h2>
            <button onClick={() => downloadChartSVG("chart-orders", `orders-${dateRange}.svg`)}
              title="Download chart as SVG"
              className="px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              ⬇
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-4">Number of orders per period</p>
          {revenue.data.length === 0 ? <p className="text-sm text-slate-500 py-8 text-center">No data yet.</p> : (
            <div id="chart-orders" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <div style={{ minWidth: 400 }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={revenue.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                  <Line type="monotone" dataKey="count" name="Orders" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Orders by Status</h2>
            <button onClick={() => downloadChartSVG("chart-status", `status-${dateRange}.svg`)}
              title="Download chart as SVG"
              className="px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              ⬇
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-4">Current distribution</p>
          {pieData.length === 0 ? <p className="text-sm text-slate-500 py-8 text-center">No data.</p> : (
            <div id="chart-status" className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width="60%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-500 dark:text-slate-400">{d.name}</span>
                    </div>
                    <span className="text-slate-900 dark:text-white font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Engineer leaderboard */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Engineer Leaderboard</h2>
        <p className="text-xs text-slate-500 mb-4">Performance ranked by completed orders</p>
        {analytics.engineerStats.length === 0 ? (
          <p className="text-sm text-slate-500">No engineers yet.</p>
        ) : (
          <div className="space-y-3">
            {[...analytics.engineerStats].sort((a, b) => b.completed - a.completed).map((e, i) => {
              const rate = e.total > 0 ? Math.round((e.completed / e.total) * 100) : 0;
              return (
                <div key={e.id} className="flex items-center gap-4">
                  <span className={`text-sm font-bold w-6 text-center ${i === 0 ? "text-yellow-500 dark:text-yellow-400" : i === 1 ? "text-slate-400 dark:text-slate-300" : i === 2 ? "text-orange-600 dark:text-orange-400" : "text-slate-400"}`}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-900 dark:text-white font-medium truncate">{e.name}</span>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 ml-2">
                        <span className="text-green-600 dark:text-green-400 font-medium">{e.completed} done</span>
                        <span>{e.total} total</span>
                        {e.bounces > 0 && <span className="text-red-600 dark:text-red-400">{e.bounces} bounce{e.bounces > 1 ? "s" : ""}</span>}
                        {e.avgTat > 0 && <span>TAT: {e.avgTat}d</span>}
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${rate}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{rate}% completion</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top parts + Low stock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Top Spare Parts Used</h2>
          <p className="text-xs text-slate-500 mb-4">Most used parts this period</p>
          {analytics.topParts.length === 0 ? <p className="text-sm text-slate-500">No parts data yet.</p> : (
            <div className="space-y-3">
              {analytics.topParts.slice(0, 6).map((p, i) => (
                <div key={p.sparePartId} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-4">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{p.part?.name}</span>
                      <span className="text-xs text-slate-900 dark:text-white font-medium ml-2 flex-shrink-0">{p._sum.quantity} used</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-mono">{p.part?.partNumber || "—"}</span>
                      <span className="text-xs text-green-600 dark:text-green-400">{formatCurrency(p._sum.total ?? 0, currency, 0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`border rounded-xl p-5 ${analytics.lowStock.length > 0 ? "bg-orange-50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800/30" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"}`}>
          <h2 className={`text-sm font-semibold mb-1 ${analytics.lowStock.length > 0 ? "text-orange-600 dark:text-orange-400" : "text-slate-700 dark:text-slate-200"}`}>
            {analytics.lowStock.length > 0 ? `⚠️ Low Stock (${analytics.lowStock.length})` : "Stock Status"}
          </h2>
          <p className="text-xs text-slate-500 mb-4">Parts below 5 units</p>
          {analytics.lowStock.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-sm text-slate-400">All parts well stocked</p>
            </div>
          ) : (
            <div className="space-y-2">
              {analytics.lowStock.map(p => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{p.partNumber || "—"}</p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <span className={`text-sm font-bold ${p.stock === 0 ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"}`}>{p.stock}</span>
                    <p className="text-xs text-slate-500">units</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SLA Compliance */}
      <div className={`border rounded-xl p-5 ${analytics.sla.compliance !== null && analytics.sla.compliance < 80 ? "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800/30" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">SLA Compliance</h2>
            <p className="text-xs text-slate-500 mt-0.5">Orders completed within their deadline</p>
          </div>
          {analytics.sla.compliance !== null && (
            <span className={`text-2xl font-bold ${analytics.sla.compliance >= 90 ? "text-green-600 dark:text-green-400" : analytics.sla.compliance >= 70 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>
              {analytics.sla.compliance}%
            </span>
          )}
        </div>
        {analytics.sla.total === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No completed orders with SLA deadlines yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{analytics.sla.total}</p>
              <p className="text-xs text-slate-500 mt-1">Total</p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-xl">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.sla.met}</p>
              <p className="text-xs text-slate-500 mt-1">Met SLA</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-xl">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{analytics.sla.breached}</p>
              <p className="text-xs text-slate-500 mt-1">Breached</p>
            </div>
          </div>
        )}
        {analytics.sla.total > 0 && analytics.sla.compliance !== null && (
          <div className="mt-4">
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${analytics.sla.compliance >= 90 ? "bg-green-500" : analytics.sla.compliance >= 70 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${analytics.sla.compliance}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-1">{analytics.sla.met} of {analytics.sla.total} completed orders met their SLA deadline</p>
          </div>
        )}
      </div>

      {/* Referral Sources */}
      {analytics.referralStats && analytics.referralStats.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Referral Sources</h2>
              <p className="text-xs text-slate-500 mt-0.5">How customers find you</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div id="referral-pie-chart">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={analytics.referralStats.map(r => ({ name: REFERRAL_LABELS[r.source] ?? r.source, value: r.count, source: r.source }))}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                    labelLine={false}
                  >
                    {analytics.referralStats.map(r => (
                      <Cell key={r.source} fill={REFERRAL_CHART_COLORS[r.source] ?? "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, "Orders"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {analytics.referralStats.map(r => (
                <div key={r.source} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: REFERRAL_CHART_COLORS[r.source] ?? "#94a3b8" }} />
                    <span className="text-slate-700 dark:text-slate-300 truncate">{REFERRAL_LABELS[r.source] ?? r.source}</span>
                  </div>
                  <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                    <span className="text-slate-900 dark:text-white font-semibold">{r.count}</span>
                    <span className="text-xs text-slate-500">{fmt(r.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loyalty Milestones */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Loyalty Milestones</h2>
            <p className="text-xs text-slate-500 mt-0.5">Customer engagement highlights</p>
          </div>
          <span className="text-2xl">🏆</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{analytics.milestones.anniversaryThisMonth}</p>
            <p className="text-xs text-slate-500 mt-1">Anniversaries this month</p>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analytics.milestones.tenPlusCustomers}</p>
            <p className="text-xs text-slate-500 mt-1">10+ order customers</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-xl">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{analytics.milestones.goldCustomers}</p>
            <p className="text-xs text-slate-500 mt-1">Gold VIP (6+ orders)</p>
          </div>
        </div>
      </div>

      </> /* end overview tab */}

      {/* ── Benchmarks tab ────────────────────────────────────────────────── */}
      {tab === "benchmarks" && (
        <div className="space-y-6">
          {benchmarksLoading && (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 h-40 animate-pulse bg-slate-100 dark:bg-slate-800/40" />
              ))}
            </div>
          )}

          {benchmarksError && !benchmarksLoading && (
            <div className="text-center py-16 space-y-3">
              <p className="text-3xl">⚠️</p>
              <p className="text-red-500 dark:text-red-400 text-sm">{benchmarksError}</p>
              <button onClick={() => { setBenchmarks(null); loadBenchmarks(); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg">Retry</button>
            </div>
          )}

          {benchmarks && !benchmarksLoading && (() => {
            const { shop: s, industry: ind, insights } = benchmarks;
            const currency2 = currency;
            const fmt2 = fmt;

            type Metric = {
              key: keyof BenchmarkMetrics;
              label: string; icon: string;
              format: (v: number) => string;
              lowerIsBetter: boolean;
            };

            const METRICS: Metric[] = [
              { key: "avgTat",          label: "Avg Repair Time",    icon: "⏱",  format: v => `${v.toFixed(1)}d`,            lowerIsBetter: true  },
              { key: "avgOrderValue",   label: "Avg Order Value",    icon: "💰",  format: v => fmt2(v),                       lowerIsBetter: false },
              { key: "bounceRate",      label: "Bounce Rate",        icon: "↩️",  format: v => `${v.toFixed(1)}%`,            lowerIsBetter: true  },
              { key: "collectionRate",  label: "Collection Rate",    icon: "✅",  format: v => `${v.toFixed(1)}%`,            lowerIsBetter: false },
              { key: "returnRate",      label: "Customer Return Rate", icon: "🔄", format: v => `${v.toFixed(1)}%`,           lowerIsBetter: false },
            ];

            function pctDiff(mine: number, theirs: number) {
              if (theirs === 0) return 0;
              return Math.round(((mine - theirs) / theirs) * 100);
            }

            function isBetter(mine: number, theirs: number, lower: boolean) {
              if (lower) return mine < theirs;
              return mine > theirs;
            }

            return (
              <>
                {/* Privacy note */}
                <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4">
                  <span className="text-blue-500 text-lg flex-shrink-0">🔒</span>
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Anonymous industry data</p>
                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-0.5">
                      Industry averages are computed across {ind.totalShops} shops and {ind.totalOrders.toLocaleString()} orders. No shop names or identifiable information is revealed.
                    </p>
                  </div>
                </div>

                {/* Metric comparison cards */}
                <div>
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Your Shop vs Industry Average</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {METRICS.map(m => {
                      const myVal = s[m.key] as number;
                      const indVal = ind[m.key] as number;
                      const diff = pctDiff(myVal, indVal);
                      const better = isBetter(myVal, indVal, m.lowerIsBetter);
                      const noData = !ind.hasEnoughData;
                      const maxBar = Math.max(myVal, indVal, 0.01);

                      return (
                        <div key={m.key} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{m.icon}</span>
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{m.label}</span>
                            </div>
                            {!noData && myVal > 0 && (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${better ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>
                                {better ? "▲" : "▼"} {Math.abs(diff)}%
                              </span>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-slate-500">Your shop</span>
                                <span className={`text-sm font-bold ${myVal === 0 ? "text-slate-400" : better && !noData ? "text-emerald-600 dark:text-emerald-400" : !noData ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>
                                  {myVal === 0 ? "—" : m.format(myVal)}
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${better && !noData ? "bg-emerald-500" : !noData ? "bg-red-500" : "bg-blue-500"}`}
                                  style={{ width: `${maxBar > 0 ? (myVal / maxBar) * 100 : 0}%` }} />
                              </div>
                            </div>
                            {!noData && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-slate-500">Industry avg</span>
                                  <span className="text-sm font-semibold text-slate-400">{indVal === 0 ? "—" : m.format(indVal)}</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                  <div className="h-full rounded-full bg-slate-400 dark:bg-slate-600 transition-all"
                                    style={{ width: `${maxBar > 0 ? (indVal / maxBar) * 100 : 0}%` }} />
                                </div>
                              </div>
                            )}
                          </div>

                          {!noData && myVal > 0 && (
                            <p className={`text-xs ${better ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                              {better
                                ? `${Math.abs(diff)}% better than industry average`
                                : `${Math.abs(diff)}% below industry average`}
                            </p>
                          )}
                          {noData && (
                            <p className="text-xs text-slate-400 italic">More shops needed for comparison</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Side-by-side bar chart */}
                {ind.hasEnoughData && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Performance at a Glance</h2>
                    <p className="text-xs text-slate-500 mb-4">Rates compared to industry — higher is better for all except bounce rate</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={[
                          { name: "Collection Rate", you: s.collectionRate, industry: ind.collectionRate },
                          { name: "Return Rate", you: s.returnRate, industry: ind.returnRate },
                          { name: "Bounce Rate (inv.)", you: Math.max(0, 100 - s.bounceRate * 10), industry: Math.max(0, 100 - ind.bounceRate * 10) },
                        ]}
                        margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} />
                        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} unit="%" domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff", fontSize: 12 }}
                          formatter={(val: number, name: string) => [`${val.toFixed(1)}%`, name]}
                        />
                        <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                        <Bar dataKey="you" name="Your Shop" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="industry" name="Industry Avg" fill="#475569" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Top 10 devices this month */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Top Repaired Devices</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{insights.month} · all shops</p>
                      </div>
                      <span className="text-xl">📱</span>
                    </div>
                    {insights.topDevices.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-8">No data this month yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={insights.topDevices} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                          <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} />
                          <YAxis type="category" dataKey="brand" tick={{ fill: "#94a3b8", fontSize: 11 }} width={68} />
                          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff", fontSize: 12 }}
                            formatter={(v: number) => [v, "Repairs"]} />
                          <Bar dataKey="count" name="Repairs" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Common faults */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Most Common Repairs</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{insights.month} · all shops</p>
                      </div>
                      <span className="text-xl">🔧</span>
                    </div>
                    {insights.commonFaults.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-8">No data this month yet.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {insights.commonFaults.slice(0, 8).map((f, i) => {
                          const max = insights.commonFaults[0]?.count ?? 1;
                          return (
                            <div key={f.label} className="flex items-center gap-3">
                              <span className="text-xs text-slate-400 w-5 text-right flex-shrink-0">#{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{f.label}</span>
                                  <span className="text-xs font-semibold text-slate-900 dark:text-white ml-2 flex-shrink-0">{f.count}</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${(f.count / max) * 100}%` }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Average prices by service type */}
                {insights.avgPrices.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Average Repair Prices</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{insights.month} · completed orders · all shops</p>
                      </div>
                      <span className="text-xl">💰</span>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={insights.avgPrices} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="service" tick={{ fill: "#64748b", fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff", fontSize: 12 }}
                          formatter={(v: number) => [fmt2(v), "Avg Price"]}
                          labelFormatter={(l) => {
                            const item = insights.avgPrices.find(p => p.service === l);
                            return `${l} (${item?.count} orders)`;
                          }}
                        />
                        <Bar dataKey="avgPrice" name="Avg Price" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                      {insights.avgPrices.map(p => (
                        <div key={p.service} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5">
                          <p className="text-xs text-slate-500 truncate">{p.service}</p>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{fmt2(p.avgPrice)}</p>
                          <p className="text-xs text-slate-400">{p.count} order{p.count !== 1 ? "s" : ""}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Industry Insights */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">💡</span>
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Industry Insights</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/70 dark:bg-slate-900/60 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{ind.totalShops}</p>
                      <p className="text-xs text-slate-500 mt-1">Shops on FixFlow</p>
                    </div>
                    <div className="bg-white/70 dark:bg-slate-900/60 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{ind.totalOrders.toLocaleString()}</p>
                      <p className="text-xs text-slate-500 mt-1">Total repairs tracked</p>
                    </div>
                    <div className="bg-white/70 dark:bg-slate-900/60 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{insights.topDevices[0]?.brand ?? "—"}</p>
                      <p className="text-xs text-slate-500 mt-1">Most repaired brand this month</p>
                    </div>
                  </div>
                  {ind.hasEnoughData && s.bounceRate < ind.bounceRate && s.collectionRate > ind.collectionRate && (
                    <div className="mt-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-lg p-3 flex items-center gap-3">
                      <span className="text-xl flex-shrink-0">🏅</span>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                        Your shop beats the industry average on both bounce rate and collection rate — top performer!
                      </p>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {tab === "copilot" && (
        <div className="space-y-4">
          <CopilotPanel
            title="Revenue Copilot"
            description="90-day business intelligence report"
            loading={copilotLoading}
            error={copilotError}
            content={copilotAnalysis}
            onRefresh={() => { setCopilotAnalysis(null); loadCopilot(); }}
            accent="violet"
            loadingMessage="Analyzing 90 days of revenue data…"
          />
          {!copilotLoading && !copilotAnalysis && !copilotError && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-violet-600 dark:text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-1">FixFlow Copilot</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-5">
                Get an AI-powered analysis of your last 90 days — insights, opportunities, and one clear action to grow revenue.
              </p>
              <button
                onClick={loadCopilot}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Generate Analysis
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
