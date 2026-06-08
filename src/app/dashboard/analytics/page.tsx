"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";

type RevenueData = {
  data: { label: string; total: number; collected: number; count: number }[];
  summary: { totalRevenue: number; totalCollected: number; totalOrders: number; avgOrderValue: number };
};

type Analytics = {
  orders: { total: number; received: number; diagnosing: number; repairing: number; done: number; delivered: number; cancelled: number };
  revenue: { total: number; collected: number; outstanding: number };
  topParts: { sparePartId: string; _sum: { quantity: number; total: number }; part: { name: string; partNumber: string } }[];
  engineerStats: { id: string; name: string; completed: number; total: number; bounces: number; avgTat: number }[];
  lowStock: { id: string; name: string; partNumber: string; stock: number; unitPrice: number }[];
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const STATUS_COLORS: Record<string, string> = {
  Received: "#3b82f6", Diagnosing: "#f59e0b", Repairing: "#ea580c",
  Done: "#10b981", Delivered: "#64748b", Cancelled: "#ef4444",
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
 const [period, setPeriod] = useState("monthly");
  const [dateRange, setDateRange] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, [period, dateRange]);

  async function loadAll() {
    setLoading(true);
    const [a, r] = await Promise.all([
      fetch(`/api/analytics?range=${dateRange}`, { credentials: "include" }).then(x => x.json()),
      fetch(`/api/reports/revenue?period=${period}&range=${dateRange}`, { credentials: "include" }).then(x => x.json()),
    ]);
    setAnalytics(a);
    setRevenue(r);
    setLoading(false);
  }

  function exportCSV(type: string) {
    window.open(`/api/export?type=${type}`, "_blank");
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Revenue, performance and insights</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["7d", "30d", "90d", "all"].map(r => (
            <button key={r} onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${dateRange === r ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
              {r === "7d" ? "7 days" : r === "30d" ? "30 days" : r === "90d" ? "90 days" : "All time"}
            </button>
          ))}
          <div className="w-px bg-slate-700 mx-1" />
          <button onClick={() => exportCSV("workorders")} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors">⬇ Orders</button>
          <button onClick={() => exportCSV("customers")} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors">⬇ Customers</button>
          <button onClick={() => exportCSV("parts")} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors">⬇ Parts</button>
        </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Orders", value: revenue.summary.totalOrders,
            sub: `${activeOrders} active`, color: "text-white", icon: "📋",
            bg: "bg-blue-500/10 border-blue-500/20",
          },
          {
            label: "Total Revenue", value: `${revenue.summary.totalRevenue.toFixed(0)} MAD`,
            sub: `Avg: ${revenue.summary.avgOrderValue.toFixed(0)} MAD`, color: "text-white", icon: "💰",
            bg: "bg-slate-900 border-slate-800",
          },
          {
            label: "Collected", value: `${revenue.summary.totalCollected.toFixed(0)} MAD`,
            sub: `${collectionRate}% collection rate`, color: "text-green-400", icon: "✅",
            bg: "bg-green-500/10 border-green-500/20",
          },
          {
            label: "Outstanding", value: `${outstanding.toFixed(0)} MAD`,
            sub: `${100 - collectionRate}% unpaid`, color: outstanding > 0 ? "text-red-400" : "text-slate-400", icon: "⏳",
            bg: outstanding > 0 ? "bg-red-500/10 border-red-500/20" : "bg-slate-900 border-slate-800",
          },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-5 ${s.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">{s.label}</p>
              <span className="text-lg">{s.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-600 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Revenue Over Time</h2>
            <p className="text-xs text-slate-500 mt-0.5">Total billed vs collected</p>
          </div>
          <div className="flex gap-2">
            {["daily", "weekly", "monthly"].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${period === p ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {revenue.data.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenue.data}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff", fontSize: 12 }} />
              <Area type="monotone" dataKey="total" name="Billed" stroke="#3b82f6" fill="url(#totalGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="collected" name="Collected" stroke="#10b981" fill="url(#collectedGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Orders volume + Status breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Orders volume */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-1">Work Orders Volume</h2>
          <p className="text-xs text-slate-500 mb-4">Number of orders per period</p>
          {revenue.data.length === 0 ? <p className="text-sm text-slate-500 py-8 text-center">No data yet.</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenue.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                <Line type="monotone" dataKey="count" name="Orders" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-1">Orders by Status</h2>
          <p className="text-xs text-slate-500 mb-4">Current distribution</p>
          {pieData.length === 0 ? <p className="text-sm text-slate-500 py-8 text-center">No data.</p> : (
            <div className="flex items-center gap-4">
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
                      <span className="text-slate-400">{d.name}</span>
                    </div>
                    <span className="text-white font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Engineer leaderboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-1">Engineer Leaderboard</h2>
        <p className="text-xs text-slate-500 mb-4">Performance ranked by completed orders</p>
        {analytics.engineerStats.length === 0 ? (
          <p className="text-sm text-slate-500">No engineers yet.</p>
        ) : (
          <div className="space-y-3">
            {[...analytics.engineerStats].sort((a, b) => b.completed - a.completed).map((e, i) => {
              const rate = e.total > 0 ? Math.round((e.completed / e.total) * 100) : 0;
              return (
                <div key={e.id} className="flex items-center gap-4">
                  <span className={`text-sm font-bold w-6 text-center ${i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-orange-400" : "text-slate-600"}`}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white font-medium truncate">{e.name}</span>
                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0 ml-2">
                        <span className="text-green-400 font-medium">{e.completed} done</span>
                        <span>{e.total} total</span>
                        {e.bounces > 0 && <span className="text-red-400">{e.bounces} bounce{e.bounces > 1 ? "s" : ""}</span>}
                        {e.avgTat > 0 && <span>TAT: {e.avgTat}d</span>}
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${rate}%` }} />
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{rate}% completion</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top parts + Low stock side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top parts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-1">Top Spare Parts Used</h2>
          <p className="text-xs text-slate-500 mb-4">Most used parts this period</p>
          {analytics.topParts.length === 0 ? <p className="text-sm text-slate-500">No parts data yet.</p> : (
            <div className="space-y-3">
              {analytics.topParts.slice(0, 6).map((p, i) => (
                <div key={p.sparePartId} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-4">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs text-slate-300 truncate">{p.part?.name}</span>
                      <span className="text-xs text-white font-medium ml-2 flex-shrink-0">{p._sum.quantity} used</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600 font-mono">{p.part?.partNumber || "—"}</span>
                      <span className="text-xs text-green-400">{p._sum.total?.toFixed(0)} MAD</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className={`border rounded-xl p-5 ${analytics.lowStock.length > 0 ? "bg-orange-950/20 border-orange-800/30" : "bg-slate-900 border-slate-800"}`}>
          <h2 className={`text-sm font-semibold mb-1 ${analytics.lowStock.length > 0 ? "text-orange-400" : "text-slate-200"}`}>
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
                    <p className="text-xs text-white truncate">{p.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{p.partNumber || "—"}</p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <span className={`text-sm font-bold ${p.stock === 0 ? "text-red-400" : "text-yellow-400"}`}>{p.stock}</span>
                    <p className="text-xs text-slate-500">units</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}