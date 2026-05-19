"use client";

import { useEffect, useState } from "react";

type UsageItem = {
  sparePartId: string;
  _sum: { quantity: number; total: number };
  _count: { id: number };
  part: { name: string; partNumber: string; unitPrice: number; stock: number } | null;
};

type Adjustment = {
  id: string;
  quantity: number;
  type: string;
  reason: string | null;
  createdAt: string;
  user: { name: string };
  sparePart: { name: string; partNumber: string };
};

type ReportData = {
  usage: UsageItem[];
  totals: { totalQuantity: number; totalRevenue: number };
  adjustments: Adjustment[];
};

const TYPE_COLORS: Record<string, string> = {
  ADD: "text-green-400",
  REMOVE: "text-red-400",
  CORRECTION: "text-yellow-400",
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/reports/parts?${params}`);
    setData(await res.json());
    setLoading(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Parts Report</h1>
        <p className="text-sm text-slate-500 mt-0.5">Consumption analysis and stock adjustment history</p>
      </div>

      {/* Date filter */}
      <div className="flex gap-3 items-end">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
        </div>
        <button onClick={load}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors">
          Apply
        </button>
        {(from || to) && (
          <button onClick={() => { setFrom(""); setTo(""); setTimeout(load, 0); }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors">
            Clear
          </button>
        )}
      </div>

      {loading && <p className="text-slate-500 text-sm">Loading...</p>}

      {data && (
        <>
          {/* Totals */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className="text-xs text-slate-500">Total Parts Used</p>
              <p className="text-2xl font-semibold text-white mt-1">{data.totals.totalQuantity}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className="text-xs text-slate-500">Parts Revenue</p>
              <p className="text-2xl font-semibold text-green-400 mt-1">{data.totals.totalRevenue.toFixed(2)}</p>
            </div>
          </div>

          {/* Consumption table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Parts Consumption</h2>
            {data.usage.length === 0 ? (
              <p className="text-sm text-slate-500">No data for this period.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    {["Part", "Part #", "Times Used", "Qty Used", "Revenue", "Current Stock"].map(h => (
                      <th key={h} className="text-left pb-2 text-xs text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.usage.map(u => (
                    <tr key={u.sparePartId} className="border-b border-slate-800/50">
                      <td className="py-2 text-white font-medium">{u.part?.name ?? "—"}</td>
                      <td className="py-2 font-mono text-xs text-slate-400">{u.part?.partNumber ?? "—"}</td>
                      <td className="py-2 text-slate-300">{u._count.id}</td>
                      <td className="py-2 text-slate-300">{u._sum.quantity}</td>
                      <td className="py-2 text-white font-medium">{u._sum.total?.toFixed(2)}</td>
                      <td className="py-2">
                        <span className={`font-medium ${(u.part?.stock ?? 0) === 0 ? "text-red-400" : (u.part?.stock ?? 0) < 5 ? "text-yellow-400" : "text-green-400"}`}>
                          {u.part?.stock ?? 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Stock adjustment history */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Stock Adjustment History</h2>
            {data.adjustments.length === 0 ? (
              <p className="text-sm text-slate-500">No adjustments recorded.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    {["Part", "Type", "Quantity", "Reason", "By", "Date"].map(h => (
                      <th key={h} className="text-left pb-2 text-xs text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.adjustments.map(a => (
                    <tr key={a.id} className="border-b border-slate-800/50">
                      <td className="py-2 text-white">{a.sparePart.name}</td>
                      <td className="py-2">
                        <span className={`font-medium text-xs ${TYPE_COLORS[a.type]}`}>{a.type}</span>
                      </td>
                      <td className="py-2 text-slate-300">{a.quantity}</td>
                      <td className="py-2 text-slate-400 text-xs">{a.reason || "—"}</td>
                      <td className="py-2 text-slate-400">{a.user.name}</td>
                      <td className="py-2 text-slate-500 text-xs">{new Date(a.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
