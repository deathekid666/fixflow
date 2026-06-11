"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

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
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [period, setPeriod] = useState("monthly");
  const [dateRange, setDateRange] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, [period, dateRange]);

  async function loadAll() {
    setLoading(true);
    const [a, r, c] = await Promise.all([
      fetch(`/api/analytics?range=${dateRange}`, { credentials: "include" }).then(x => x.json()),
      fetch(`/api/reports/revenue?period=${period}&range=${dateRange}`, { credentials: "include" }).then(x => x.json()),
      fetch(`/api/analytics/comparison`, { credentials: "include" }).then(x => x.json()),
    ]);
    setAnalytics(a);
    setRevenue(r);
    setComparison(c);
    setLoading(false);
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
      ["Total Revenue (MAD)", s.totalRevenue.toFixed(2)],
      ["Total Collected (MAD)", s.totalCollected.toFixed(2)],
      ["Total Expenses (MAD)", s.totalExpenses.toFixed(2)],
      ["Net Profit (MAD)", s.profit.toFixed(2)],
      ["Avg Order Value (MAD)", s.avgOrderValue.toFixed(2)],
      [],
      ["Period", "Revenue (MAD)", "Collected (MAD)", "Expenses (MAD)", "Profit (MAD)", "Orders"],
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

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <p className="text-slate-500 text-sm">Loading analytics...</p>
    </div>
  );
  if (!analytics || !revenue) return null;

  const outstanding = revenue.summary.totalRevenue - revenue.summary.totalCollected;
  const collectionRate = revenue.summary.totalRevenue > 0
    ? Math.round((revenue.summary.totalCollected / revenue.summary.totalRevenue) * 100)
    : 0;

  const pieData = [
    { name: "Received", value: analytics.orders.received },
    { name: "Diagnosing", value: analytics.orders.diagnosing },
    { name: "Repairing", value: analytics.orders.repairing },
    { name: "Done", value: analytics.orders.done },
    { name: "Delivered", value: analytics.orders.delivered },
    { name: "Cancelled", value: analytics.orders.cancelled },
  ].filter(d => d.value > 0);

  const activeOrders = analytics.orders.received + analytics.orders.diagnosing + analytics.orders.repairing + analytics.orders.done;
  const profitMargin = revenue.summary.totalCollected > 0
    ? Math.round((revenue.summary.profit / revenue.summary.totalCollected) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Revenue, expenses, profit and insights</p>
        </div>
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
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Orders", value: revenue.summary.totalOrders, sub: `${activeOrders} active`, color: "text-slate-900 dark:text-white", icon: "📋", bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "Revenue", value: `${revenue.summary.totalRevenue.toFixed(0)} MAD`, sub: `Avg: ${revenue.summary.avgOrderValue.toFixed(0)} MAD`, color: "text-slate-900 dark:text-white", icon: "💰", bg: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" },
          { label: "Collected", value: `${revenue.summary.totalCollected.toFixed(0)} MAD`, sub: `${collectionRate}% rate`, color: "text-green-600 dark:text-green-400", icon: "✅", bg: "bg-green-500/10 border-green-500/20" },
          { label: "Expenses", value: `${revenue.summary.totalExpenses.toFixed(0)} MAD`, sub: "Total costs", color: "text-red-600 dark:text-red-400", icon: "💸", bg: "bg-red-500/10 border-red-500/20" },
          { label: "Net Profit", value: `${revenue.summary.profit.toFixed(0)} MAD`, sub: `${profitMargin}% margin`, color: revenue.summary.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400", icon: revenue.summary.profit >= 0 ? "📈" : "📉", bg: revenue.summary.profit >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20" },
          { label: "Outstanding", value: `${outstanding.toFixed(0)} MAD`, sub: `${100 - collectionRate}% unpaid`, color: outstanding > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-slate-500", icon: "⏳", bg: outstanding > 0 ? "bg-yellow-500/10 border-yellow-500/20" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" },
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
            fmt: (v: number) => `${v.toFixed(0)} MAD`,
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
            fmt: (v: number) => `${v.toFixed(0)} MAD`,
            invert: true,
          },
          {
            label: "Net Profit",
            icon: tm.profit >= 0 ? "📈" : "📉",
            curr: tm.profit, prev: lm.profit,
            fmt: (v: number) => `${v.toFixed(0)} MAD`,
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
          <div id="chart-revenue">
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
            <div id="chart-orders">
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
            <div id="chart-status" className="flex items-center gap-4">
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
                      <span className="text-xs text-green-600 dark:text-green-400">{p._sum.total?.toFixed(0)} MAD</span>
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
    </div>
  );
}
