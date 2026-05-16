"use client";

import { useEffect, useState } from "react";

type Analytics = {
  orders: { total: number; received: number; diagnosing: number; repairing: number; done: number; delivered: number; cancelled: number };
  revenue: { total: number; collected: number; outstanding: number };
  topParts: { sparePartId: string; _sum: { quantity: number; total: number }; part: { name: string; partNumber: string } }[];
  engineerStats: { id: string; name: string; completed: number; total: number; bounces: number; avgTat: number }[];
  lowStock: { id: string; name: string; partNumber: string; stock: number; unitPrice: number }[];
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics").then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-slate-500 text-sm">Loading...</div>;
  if (!data) return <div className="p-6 text-slate-500 text-sm">Failed to load.</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Overview of your repair shop performance</p>
      </div>

      {/* Revenue */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Revenue", value: data.revenue.total.toFixed(2), color: "text-white" },
          { label: "Collected", value: data.revenue.collected.toFixed(2), color: "text-green-400" },
          { label: "Outstanding", value: data.revenue.outstanding.toFixed(2), color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Orders by status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Work Orders by Status</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total", value: data.orders.total, color: "text-white" },
            { label: "Received", value: data.orders.received, color: "text-blue-400" },
            { label: "Diagnosing", value: data.orders.diagnosing, color: "text-yellow-400" },
            { label: "Repairing", value: data.orders.repairing, color: "text-orange-400" },
            { label: "Done", value: data.orders.done, color: "text-green-400" },
            { label: "Delivered", value: data.orders.delivered, color: "text-slate-400" },
            { label: "Cancelled", value: data.orders.cancelled, color: "text-red-400" },
          ].map(s => (
            <div key={s.label} className="bg-slate-800 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`text-2xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Engineer Performance */}
      {data.engineerStats.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Engineer Performance</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {["Engineer", "Assigned", "Completed", "Bounces", "Avg TAT"].map(h => (
                  <th key={h} className="text-left pb-2 text-xs text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.engineerStats.map(e => (
                <tr key={e.id} className="border-b border-slate-800/50">
                  <td className="py-2 text-white font-medium">{e.name}</td>
                  <td className="py-2 text-slate-300">{e.total}</td>
                  <td className="py-2 text-green-400">{e.completed}</td>
                  <td className="py-2">
                    {e.bounces > 0
                      ? <span className="text-red-400">{e.bounces}</span>
                      : <span className="text-slate-500">0</span>
                    }
                  </td>
                  <td className="py-2 text-slate-300">{e.avgTat > 0 ? `${e.avgTat}d` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Low Stock Alert */}
      {data.lowStock.length > 0 && (
        <div className="bg-orange-950/20 border border-orange-800/30 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-orange-400 mb-4">⚠️ Low Stock Alert ({data.lowStock.length} parts)</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-orange-800/20">
                {["Part", "Part #", "Stock", "Unit Price"].map(h => (
                  <th key={h} className="text-left pb-2 text-xs text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.lowStock.map(p => (
                <tr key={p.id} className="border-b border-orange-800/10">
                  <td className="py-2 text-white">{p.name}</td>
                  <td className="py-2 font-mono text-xs text-slate-400">{p.partNumber || "—"}</td>
                  <td className="py-2">
                    <span className={`font-semibold ${p.stock === 0 ? "text-red-400" : "text-yellow-400"}`}>{p.stock}</span>
                  </td>
                  <td className="py-2 text-slate-300">{p.unitPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Top Parts */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Top Spare Parts Used</h2>
        {data.topParts.length === 0 ? (
          <p className="text-sm text-slate-500">No parts data yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {["Part", "Part #", "Qty Used", "Revenue"].map(h => (
                  <th key={h} className="text-left pb-2 text-xs text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.topParts.map(p => (
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
    </div>
  );
}
