"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type WorkOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deviceBrand: string;
  deviceModel: string;
  status: string;
  faultLevel: string;
  isUnderWarranty: boolean;
  isBounce: boolean;
  bounceCount: number;
  createdAt: string;
  assignee: { name: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: "bg-blue-500/20 text-blue-400",
  DIAGNOSING: "bg-yellow-500/20 text-yellow-400",
  REPAIRING: "bg-orange-500/20 text-orange-400",
  DONE: "bg-green-500/20 text-green-400",
  DELIVERED: "bg-slate-500/20 text-slate-400",
  CANCELLED: "bg-red-500/20 text-red-400",
};

const FAULT_COLORS: Record<string, string> = {
  LOW: "text-green-400",
  MEDIUM: "text-yellow-400",
  HIGH: "text-red-400",
};

const STATUS_OPTIONS = ["RECEIVED", "DIAGNOSING", "REPAIRING", "DONE", "DELIVERED", "CANCELLED"];

export default function DashboardPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => { load(); }, [search, statusFilter]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/workorders?${params}`);
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setSelected([]);
    setLoading(false);
  }

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function toggleAll() {
    setSelected(prev => prev.length === orders.length ? [] : orders.map(o => o.id));
  }

  async function applyBulkStatus() {
    if (!bulkStatus || selected.length === 0) return;
    setBulkLoading(true);
    await fetch("/api/workorders/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected, status: bulkStatus }),
    });
    setBulkStatus("");
    setSelected([]);
    await load();
    setBulkLoading(false);
  }

  const counts = {
    total: orders.length,
    received: orders.filter(o => o.status === "RECEIVED").length,
    repairing: orders.filter(o => o.status === "REPAIRING").length,
    done: orders.filter(o => o.status === "DONE").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Work Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage repair work orders</p>
        </div>
        <Link href="/dashboard/workorders/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors font-medium">
          + New Work Order
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total", value: counts.total, color: "text-white" },
          { label: "Received", value: counts.received, color: "text-blue-400" },
          { label: "Repairing", value: counts.repairing, color: "text-orange-400" },
          { label: "Done", value: counts.done, color: "text-green-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <input
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          placeholder="Search by customer, phone, device, order number..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 bg-blue-600/10 border border-blue-600/30 rounded-lg px-4 py-3">
          <span className="text-sm text-blue-400 font-medium">{selected.length} selected</span>
          <select
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
            value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
            <option value="">Change status to...</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={applyBulkStatus} disabled={!bulkStatus || bulkLoading}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors">
            {bulkLoading ? "Updating..." : "Apply"}
          </button>
          <button onClick={() => setSelected([])}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors">
            Cancel
          </button>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3">
                <input type="checkbox"
                  checked={selected.length === orders.length && orders.length > 0}
                  onChange={toggleAll}
                  className="rounded" />
              </th>
              {["Order #", "Customer", "Device", "Fault", "Status", "Assigned", "Date", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>}
            {!loading && orders.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">No work orders found.</td></tr>}
            {orders.map(o => (
              <tr key={o.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${selected.includes(o.id) ? "bg-blue-600/5" : ""}`}>
                <td className="px-4 py-3">
                  <input type="checkbox"
                    checked={selected.includes(o.id)}
                    onChange={() => toggleSelect(o.id)}
                    className="rounded" />
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-slate-400">{o.orderNumber.slice(0, 8).toUpperCase()}</span>
                  {o.isUnderWarranty && <span className="ml-1 text-xs bg-green-500/20 text-green-400 px-1 rounded">W</span>}
                  {o.isBounce && <span className="ml-1 text-xs bg-red-500/20 text-red-400 px-1 rounded">B</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="text-white font-medium">{o.customerName}</div>
                  <div className="text-xs text-slate-500">{o.customerPhone}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-white">{o.deviceBrand}</div>
                  <div className="text-xs text-slate-500">{o.deviceModel}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${FAULT_COLORS[o.faultLevel]}`}>{o.faultLevel}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{o.assignee?.name ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link href={`/dashboard/workorders/${o.id}/edit`}
                      className="text-xs text-slate-400 hover:text-white transition-colors">Edit</Link>
                    <Link href={`/dashboard/workorders/${o.id}`}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View →</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}