"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type WarrantyOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deviceBrand: string;
  deviceModel: string;
  warrantyStart: string | null;
  warrantyEnd: string;
  status: string;
  total: number;
  createdAt: string;
  assignee: { name: string } | null;
};

type Data = { active: WarrantyOrder[]; expiringSoon: WarrantyOrder[]; expired: WarrantyOrder[] };
type Tab = "active" | "expiringSoon" | "expired";

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function daysSince(date: string) {
  return Math.ceil((Date.now() - new Date(date).getTime()) / 86400000);
}

function orderLabel(o: WarrantyOrder) {
  return o.orderNumber.startsWith("wo-") ? o.orderNumber.toUpperCase() : o.orderNumber.slice(0, 8).toUpperCase();
}

function WarrantyCard({ o, tab }: { o: WarrantyOrder; tab: Tab }) {
  const days = tab === "expired" ? daysSince(o.warrantyEnd) : daysUntil(o.warrantyEnd);
  const border =
    tab === "expiringSoon" && days <= 7 ? "border-red-600/40 bg-red-950/10" :
    tab === "expiringSoon" ? "border-orange-600/40 bg-orange-950/10" :
    tab === "active" ? "border-green-800/30 bg-slate-900" :
    "border-slate-700 bg-slate-900";

  const badgeClass =
    tab === "active" ? "bg-green-500/20 text-green-400 border border-green-500/20" :
    tab === "expiringSoon" && days <= 7 ? "bg-red-500/20 text-red-400 border border-red-500/20" :
    tab === "expiringSoon" ? "bg-orange-500/20 text-orange-400 border border-orange-500/20" :
    "bg-slate-700/50 text-slate-400";

  const badgeText =
    tab === "active" ? `${days}d left` :
    tab === "expiringSoon" ? `${days}d left` :
    `${days}d ago`;

  return (
    <div className={`border rounded-xl p-4 space-y-3 ${border}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="font-mono text-xs text-slate-400">{orderLabel(o)}</span>
          <div className="text-white font-medium mt-0.5">{o.customerName}</div>
          <div className="text-xs text-slate-500">{o.customerPhone}</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${badgeClass}`}>{badgeText}</span>
      </div>

      <div className="text-sm text-slate-300">{o.deviceBrand} {o.deviceModel}</div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-800/60 rounded-lg px-3 py-2">
          <p className="text-slate-500 mb-0.5">Warranty ends</p>
          <p className="text-white font-medium">{new Date(o.warrantyEnd).toLocaleDateString()}</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg px-3 py-2">
          <p className="text-slate-500 mb-0.5">{o.warrantyStart ? "Started" : "Repaired"}</p>
          <p className="text-white font-medium">{new Date(o.warrantyStart ?? o.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
        <span className="text-xs text-slate-500">{o.assignee?.name ?? "Unassigned"}</span>
        <Link href={`/dashboard/workorders/${o.id}`} className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
          View →
        </Link>
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="py-12 text-center">
      <p className="text-3xl mb-3">{tab === "active" ? "🛡️" : tab === "expiringSoon" ? "⏳" : "📁"}</p>
      <p className="text-slate-400 font-medium">
        {tab === "active" ? "No active warranties" : tab === "expiringSoon" ? "None expiring within 30 days" : "No expired warranties"}
      </p>
      <p className="text-xs text-slate-600 mt-1">Warranties are set when creating or editing a work order</p>
    </div>
  );
}

function WarrantyTable({ orders, tab }: { orders: WarrantyOrder[]; tab: Tab }) {
  if (orders.length === 0) return <EmptyState tab={tab} />;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-800">
          {["Order #", "Customer", "Device", "Warranty Period", "Remaining", "Assigned", ""].map(h => (
            <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {orders.map(o => {
          const days = tab === "expired" ? daysSince(o.warrantyEnd) : daysUntil(o.warrantyEnd);
          const remainingColor =
            tab === "active" ? "text-green-400" :
            tab === "expiringSoon" && days <= 7 ? "text-red-400 font-semibold" :
            tab === "expiringSoon" ? "text-orange-400 font-semibold" :
            "text-slate-500";

          return (
            <tr key={o.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-slate-400">{orderLabel(o)}</td>
              <td className="px-4 py-3">
                <div className="text-white font-medium">{o.customerName}</div>
                <div className="text-xs text-slate-500">{o.customerPhone}</div>
              </td>
              <td className="px-4 py-3">
                <div className="text-slate-300">{o.deviceBrand}</div>
                <div className="text-xs text-slate-500">{o.deviceModel}</div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-400">
                {o.warrantyStart ? new Date(o.warrantyStart).toLocaleDateString() : "—"} → {new Date(o.warrantyEnd).toLocaleDateString()}
              </td>
              <td className={`px-4 py-3 text-xs ${remainingColor}`}>
                {tab === "expired" ? `${days}d ago` : `${days}d`}
              </td>
              <td className="px-4 py-3 text-slate-400 text-xs">{o.assignee?.name ?? "—"}</td>
              <td className="px-4 py-3">
                <Link href={`/dashboard/workorders/${o.id}`} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View →</Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function WarrantiesPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("active");

  useEffect(() => {
    fetch("/api/warranties", { credentials: "include" })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const tabs: { key: Tab; label: string; icon: string; count: number; activeClass: string }[] = data ? [
    { key: "active", label: "Active", icon: "🛡️", count: data.active.length, activeClass: "text-green-400 border-green-500" },
    { key: "expiringSoon", label: "Expiring Soon", icon: "⏳", count: data.expiringSoon.length, activeClass: data.expiringSoon.length > 0 ? "text-orange-400 border-orange-500" : "text-slate-400 border-slate-500" },
    { key: "expired", label: "Expired", icon: "📁", count: data.expired.length, activeClass: "text-slate-400 border-slate-500" },
  ] : [];

  const current = data?.[tab] ?? [];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-white">Warranties</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track warranty status across all repaired devices</p>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Active</p>
            <p className="text-2xl font-bold text-green-400">{data.active.length}</p>
            <p className="text-xs text-slate-600 mt-1">under warranty</p>
          </div>
          <div className={`border rounded-xl p-4 ${data.expiringSoon.length > 0 ? "bg-orange-500/10 border-orange-500/20" : "bg-slate-900 border-slate-800"}`}>
            <p className="text-xs text-slate-500 mb-1">Expiring Soon</p>
            <p className={`text-2xl font-bold ${data.expiringSoon.length > 0 ? "text-orange-400" : "text-slate-400"}`}>{data.expiringSoon.length}</p>
            <p className="text-xs text-slate-600 mt-1">within 30 days</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Expired</p>
            <p className="text-2xl font-bold text-slate-400">{data.expired.length}</p>
            <p className="text-xs text-slate-600 mt-1">past end date</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!loading && (
        <div className="flex gap-1 border-b border-slate-800">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key ? `${t.activeClass} bg-transparent` : "text-slate-500 border-transparent hover:text-slate-300"
              }`}>
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-white/10" : "bg-slate-800"}`}>{t.count}</span>
            </button>
          ))}
        </div>
      )}

      {loading && <div className="py-16 text-center text-slate-500 text-sm">Loading warranties...</div>}

      {!loading && data && (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {current.length === 0 ? <EmptyState tab={tab} /> : current.map(o => <WarrantyCard key={o.id} o={o} tab={tab} />)}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <WarrantyTable orders={current} tab={tab} />
          </div>
        </>
      )}
    </div>
  );
}
