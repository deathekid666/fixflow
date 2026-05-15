"use client";

import { useEffect, useState } from "react";

type Analytics = {
  orders: { total: number; received: number; diagnosing: number; repairing: number; done: number; delivered: number; cancelled: number };
  revenue: { total: number; collected: number; outstanding: number };
  topParts: { sparePartId: string; _sum: { quantity: number; total: number }; part: { name: string; partNumber: string } }[];
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-slate-500 text-sm">Loading...</div>;
  if (!data) return <div className="p-6 text-slate-500 text-sm">Failed to load.</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Overview of your repair shop performance</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Revenue", value: data.revenue.total.toFixed(2), color: "text-white" },
          { label: "Collected", value: data.revenue.collected.toFixed(2), color: "text-green-400" },
          { label: "Outstanding", value: data.revenue.outstanding.toFixed(2), color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Work Orders by Status</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total", value: data.orders.total, color: "text-white" },
            { label: "Received", value: data.orders.received, color: "text-blue-400" },
            { label: "Diagnosing", value: data.orders.diagnosing, color: "text-yellow-400" },
            { label: "Repairing", value: data.orders.repairing, color: "text-orange-400" },
            { label: "Done", value: data.orders.done, color: "text-green-400" },
            { label: "Delivered", value: data.orders.delivered, color: "text-slate-400" },
            { label: "Cancelled", value: data.orders.cancelled, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="flex justify-between items-center py-2 border-b border-slate-800/50">
              <span className="text-sm text-slate-400">{s.label}</span>
              <span className={`text-lg font-semibold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Top Spare Parts Used</h2>
        {data.topParts.length === 0 ? (
          <p className="text-sm text-slate-500">No parts data yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left pb-2 text-xs text-slate-500">Part</th>
                <th className="text-left pb-2 text-xs text-slate-500">Part #</th>
                <th className="text-right pb-2 text-xs text-slate-500">Qty Used</th>
                <th className="text-right pb-2 text-xs text-slate-500">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.topParts.map((p) => (
                <tr key={p.sparePartId} className="border-b border-slate-800/50">
                  <td className="py-2 text-white">{p.part?.name}</td>
                  <td className="py-2 font-mono text-xs text-slate-400">{p.part?.partNumber || "—"}</td>
                  <td className="py-2 text-right text-slate-300">{p._sum.quantity}</td>
                  <td className="py-2 text-right text-white font-medium">{p._sum.total?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}