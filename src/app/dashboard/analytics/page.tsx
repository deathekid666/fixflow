"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";

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

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4"];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [period, setPeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, [period]);

  async function loadAll() {
    setLoading(true);
    const [a, r] = await Promise.all([
      fetch("/api/analytics").then(x => x.json()),
      fetch(`/api/reports/revenue?period=${period}`).then(x => x.json()),
    ]);
    setAnalytics(a);
    setRevenue(r);
    setLoading(false);
  }

  function exportCSV(type: string) {
    window.open(`/api/export?type=${type}`, "_blank");
  }

  if (loading) return <div className="p-6 text-slate-500 text-sm">Loading...</div>;
  if (!analytics || !revenue) return null;

  const pieData = [
    { name: "Received", value: analytics.orders.received },
    { name: "Diagnosing", value: analytics.orders.diagnosing },
    { name: "Repairing", value: analytics.orders.repairing },
    { name: "Done", value: analytics.orders.done },
    { name: "Delivered", value: analytics.orders.delivered },
    { name: "Cancelled", value: analytics.orders.cancelled },
  ].filter(d => d.value > 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Revenue, performance and insights</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCSV("workorders")} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors">⬇ Export Orders</button>
          <button onClick={() => exportCSV("customers")} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors">⬇ Export Customers</button>
          <button onClick={() => exportCSV("parts")} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors">⬇ Export Parts</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: revenue.summary.totalOrders, color: "text-white" },
          { label: "Total Revenue", value: revenue.summary.totalRevenue.toFixed(2), color: "text-white" },
          { label: "Collected", value: revenue.summary.totalCollected.toFixed(2), color: "text-green-400" },
          { label: "Avg Order Value", value: revenue.summary.avgOrderValue.toFixed(2), color: "text-blue-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-300">Revenue Over Time</h2>
          <div className="flex gap-2">
            {["daily","weekly","monthly"].map(p => (
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
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenue.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff" }} />
              <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Orders per period line chart */}
      {revenue.data.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Work Orders Volume</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenue.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff" }} />
              <Line type="monotone" dataKey="count" name="Orders" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Status pie chart + engineer stats side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Orders by Status</h2>
          {pieData.length === 0 ? (
            <p className="text-sm text-slate-500">No data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Engineer Performance</h2>
          {analytics.engineerStats.length === 0 ? (
            <p className="text-sm text-slate-500">No engineers yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800">
                {["Engineer","Assigned","Done","Bounces","Avg TAT"].map(h => (
                  <th key={h} className="text-left pb-2 text-xs text-slate-500">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {analytics.engineerStats.map(e => (
                  <tr key={e.id} className="border-b border-slate-800/50">
                    <td className="py-2 text-white font-medium">{e.name}</td>
                    <td className="py-2 text-slate-300">{e.total}</td>
                    <td className="py-2 text-green-400">{e.completed}</td>
                    <td className="py-2">{e.bounces > 0 ? <span className="text-red-400">{e.bounces}</span> : <span className="text-slate-500">0</span>}</td>
                    <td className="py-2 text-slate-300">{e.avgTat > 0 ? `${e.avgTat}d` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Top parts */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Top Spare Parts Used</h2>
        {analytics.topParts.length === 0 ? (
          <p className="text-sm text-slate-500">No parts data yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-800">
              {["Part","Part #","Qty Used","Revenue"].map(h => (
                <th key={h} className="text-left pb-2 text-xs text-slate-500">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {analytics.topParts.map(p => (
                <tr key={p.sparePartId} className="border-b border-slate-800/50">
                  <td className="py-2 text-white">{p.part?.name}</td>
                  <td className="py-2 font-mono text-xs text-slate-400">{p.part?.partNumber || "—"}</td>
                  <td className="py-2 text-slate-300">{p._sum.quantity}</td>
                  <td className="py-2 text-white font-medium">{p._sum.total?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Low stock alert */}
      {analytics.lowStock.length > 0 && (
        <div className="bg-orange-950/20 border border-orange-800/30 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-orange-400 mb-4">⚠️ Low Stock ({analytics.lowStock.length} parts)</h2>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-orange-800/20">
              {["Part","Part #","Stock","Unit Price"].map(h => (
                <th key={h} className="text-left pb-2 text-xs text-slate-500">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {analytics.lowStock.map(p => (
                <tr key={p.id} className="border-b border-orange-800/10">
                  <td className="py-2 text-white">{p.name}</td>
                  <td className="py-2 font-mono text-xs text-slate-400">{p.partNumber || "—"}</td>
                  <td className="py-2"><span className={`font-semibold ${p.stock === 0 ? "text-red-400" : "text-yellow-400"}`}>{p.stock}</span></td>
                  <td className="py-2 text-slate-300">{p.unitPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
