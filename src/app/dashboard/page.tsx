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

export default function DashboardPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    load();
  }, [search, statusFilter]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/workorders?${params}`);
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  const counts = {
    total: orders.length,
    received: orders.filter(o => o.status === "RECEIVED").length,
    repairing: orders.filter(o => o.status === "REPAIRING").length,
    done: orders.filter(o => o.status === "DONE").length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Work Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage repair work orders</p>
        </div>
        <Link href="/dashboard/workorders/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors font-medium"
        >
          + New Work Order
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total", value: counts.total, color: "text-white" },
          { label: "Received", value: counts.received, color: "text-blue-400" },
          { label: "Repairing", value: counts.repairing, color: "text-orange-400" },
          { label: "Done", value: counts.done, color: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          placeholder="Search by customer, phone, device, order number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="RECEIVED">Received</option>
          <option value="DIAGNOSING">Diagnosing</option>
          <option value="REPAIRING">Repairing</option>
          <option value="DONE">Done</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              {["Order #", "Customer", "Device", "Fault Level", "Status", "Assigned To", "Date", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
            )}
            {!loading && orders.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No work orders found.</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-slate-400">{o.orderNumber.slice(0, 8).toUpperCase()}</span>
                  {o.isUnderWarranty && <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">W</span>}
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
                  <Link href={`/dashboard/workorders/${o.id}`}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
