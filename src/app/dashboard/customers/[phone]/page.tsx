"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type WorkOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deviceBrand: string;
  deviceModel: string;
  serialNumber: string;
  status: string;
  total: number;
  collected: number;
  createdAt: string;
  doneAt: string | null;
  isBounce: boolean;
  bounceCount: number;
  assignee: { name: string } | null;
  _count: { parts: number };
};

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: "bg-blue-500/20 text-blue-400",
  DIAGNOSING: "bg-yellow-500/20 text-yellow-400",
  REPAIRING: "bg-orange-500/20 text-orange-400",
  DONE: "bg-green-500/20 text-green-400",
  DELIVERED: "bg-slate-500/20 text-slate-400",
  CANCELLED: "bg-red-500/20 text-red-400",
};

export default function CustomerDetailPage({ params }: { params: { phone: string } }) {
  const router = useRouter();
  const phone = decodeURIComponent(params.phone);
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customers/history?phone=${encodeURIComponent(phone)}`)
      .then(r => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  const totalSpent = orders.reduce((s, o) => s + o.total, 0);
  const totalCollected = orders.reduce((s, o) => s + o.collected, 0);
  const customer = orders[0];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white text-sm">← Back</button>
        <h1 className="text-xl font-semibold text-white">{loading ? "Loading..." : customer?.customerName ?? phone}</h1>
        {orders.length > 1 && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Repeat Customer</span>}
      </div>

      {!loading && customer && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer Info</h2>
            <div className="space-y-2 text-sm">
              <div><p className="text-xs text-slate-500">Phone</p><p className="text-white">{phone}</p></div>
              <div><p className="text-xs text-slate-500">Email</p><p className="text-white">{customer.customerEmail || "—"}</p></div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Summary</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-slate-500">Total Orders</p><p className="text-white text-xl font-semibold">{orders.length}</p></div>
              <div><p className="text-xs text-slate-500">Total Spent</p><p className="text-white text-xl font-semibold">{totalSpent.toFixed(2)}</p></div>
              <div><p className="text-xs text-slate-500">Collected</p><p className="text-green-400 font-semibold">{totalCollected.toFixed(2)}</p></div>
              <div><p className="text-xs text-slate-500">Outstanding</p><p className="text-red-400 font-semibold">{(totalSpent - totalCollected).toFixed(2)}</p></div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-300">Repair History</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              {["Device", "SN", "Status", "Parts", "Total", "Date", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>}
            {!loading && orders.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No orders found.</td></tr>}
            {orders.map(o => (
              <tr key={o.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="text-white">{o.deviceBrand} {o.deviceModel}</div>
                  {o.isBounce && <span className="text-xs text-red-400">⚠️ Bounce ×{o.bounceCount}</span>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{o.serialNumber || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-400">{o._count.parts}</td>
                <td className="px-4 py-3 text-white">{o.total.toFixed(2)}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/workorders/${o.id}`} className="text-xs text-blue-400 hover:text-blue-300">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}