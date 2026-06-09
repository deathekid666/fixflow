"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import UpgradeModal from "@/components/UpgradeModal";

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
  assignee: { id: string; name: string } | null;
  total: number;
  collected: number;
  tatDays: number;
  isOverdue: boolean;
};

type Engineer = { id: string; name: string };

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
const PAGE_SIZE = 20;

export default function DashboardPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [page, setPage] = useState(1);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkEngineer, setBulkEngineer] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  // Upgrade modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState({ limit: 50, current: 50 });

  useEffect(() => { setPage(1); }, [search, statusFilter]);
  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetch("/api/users", { credentials: "include" })
      .then(r => r.json())
      .then(d => setEngineers(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", page.toString());
    params.set("limit", PAGE_SIZE.toString());
    const res = await fetch(`/api/workorders?${params}`, { credentials: "include" });
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setSelected(new Set());
    setLoading(false);
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === orders.length) setSelected(new Set());
    else setSelected(new Set(orders.map(o => o.id)));
  }

  async function applyBulkStatus() {
    if (!bulkStatus || selected.size === 0) return;
    setBulkLoading(true);
    await Promise.all([...selected].map(id =>
      fetch(`/api/workorders/${id}/status`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ status: bulkStatus }),
      })
    ));
    setBulkStatus(""); await load(); setBulkLoading(false);
  }

  async function applyBulkEngineer() {
    if (!bulkEngineer || selected.size === 0) return;
    setBulkLoading(true);
    await Promise.all([...selected].map(id =>
      fetch(`/api/workorders/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ assignedTo: bulkEngineer }),
      })
    ));
    setBulkEngineer(""); await load(); setBulkLoading(false);
  }

  function exportSelected() {
    const selectedOrders = orders.filter(o => selected.has(o.id));
    const csv = [
      ["Order #", "Customer", "Phone", "Device", "Status", "Total", "Date"].join(","),
      ...selectedOrders.map(o => [
        o.orderNumber.slice(0, 8).toUpperCase(),
        o.customerName, o.customerPhone,
        `${o.deviceBrand} ${o.deviceModel}`,
        o.status, o.total.toFixed(2),
        new Date(o.createdAt).toLocaleDateString(),
      ].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "workorders.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const allOrders = orders;
  const active = allOrders.filter(o => !["DELIVERED", "CANCELLED"].includes(o.status));
  const totalRevenue = allOrders.filter(o => o.status === "DELIVERED").reduce((s, o) => s + o.total, 0);
  const pendingPayment = allOrders.filter(o => o.status === "DELIVERED").reduce((s, o) => s + (o.total - o.collected), 0);
  const overdue = allOrders.filter(o => o.isOverdue).length;

  const stats = [
    { label: "Total Orders", value: allOrders.length, sub: `${active.length} active`, color: "text-white", icon: "📋" },
    { label: "Received", value: allOrders.filter(o => o.status === "RECEIVED").length, sub: "awaiting diagnosis", color: "text-blue-400", icon: "📥" },
    { label: "In Progress", value: allOrders.filter(o => ["DIAGNOSING", "REPAIRING"].includes(o.status)).length, sub: `${overdue} overdue`, color: overdue > 0 ? "text-orange-400" : "text-yellow-400", icon: "🔧" },
    { label: "Ready", value: allOrders.filter(o => o.status === "DONE").length, sub: "awaiting pickup", color: "text-green-400", icon: "✅" },
    { label: "Revenue", value: `${totalRevenue.toFixed(0)} MAD`, sub: `${pendingPayment.toFixed(0)} pending`, color: "text-emerald-400", icon: "💰" },
    { label: "Delivered", value: allOrders.filter(o => o.status === "DELIVERED").length, sub: "this period", color: "text-slate-400", icon: "📦" },
  ];

  return (
    <div className="p-6 space-y-6">
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} feature="work orders" limit={upgradeInfo.limit} current={upgradeInfo.current} />
      )}

      {/* Header */}
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

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{s.label}</p>
              <span className="text-base">{s.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-600">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          className="flex-1 min-w-[200px] bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          placeholder="Search by customer, phone, device, order number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          {["", "RECEIVED", "DIAGNOSING", "REPAIRING", "DONE", "DELIVERED", "CANCELLED"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs rounded-lg border font-medium transition-colors ${
                statusFilter === s
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600"
              }`}>
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="bg-blue-950/40 border border-blue-800/50 rounded-xl px-4 py-3 flex items-center gap-4 flex-wrap">
          <span className="text-sm text-blue-300 font-medium">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none">
              <option value="">Change status...</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={applyBulkStatus} disabled={!bulkStatus || bulkLoading}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors">
              Apply
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select value={bulkEngineer} onChange={e => setBulkEngineer(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none">
              <option value="">Assign engineer...</option>
              {engineers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <button onClick={applyBulkEngineer} disabled={!bulkEngineer || bulkLoading}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors">
              Assign
            </button>
          </div>
          <button onClick={exportSelected}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors ml-auto">
            ⬇ Export ({selected.size})
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-slate-500 hover:text-slate-300">✕ Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 w-8">
                <input type="checkbox"
                  checked={orders.length > 0 && selected.size === orders.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-600 bg-slate-800 cursor-pointer" />
              </th>
              {["Order #", "Customer", "Device", "Fault", "Status", "Assigned To", "Total", "Date", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>}
            {!loading && orders.length === 0 && <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-500">No work orders found.</td></tr>}
            {orders.map((o) => (
              <tr key={o.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${selected.has(o.id) ? "bg-blue-950/20" : ""}`}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSelect(o.id)}
                    className="rounded border-slate-600 bg-slate-800 cursor-pointer" />
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-slate-400">
                    {o.orderNumber.startsWith("wo-") ? o.orderNumber.toUpperCase() : o.orderNumber.slice(0, 8).toUpperCase()}
                  </span>
                  {o.isUnderWarranty && <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">W</span>}
                  {o.isOverdue && <span className="ml-1 text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">⚠</span>}
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
                <td className="px-4 py-3 text-slate-300 text-xs font-medium">
                  {o.total > 0 ? `${o.total.toFixed(0)} MAD` : "—"}
                  {o.total > o.collected && o.status === "DELIVERED" && (
                    <span className="text-red-400 ml-1 text-xs">({(o.total - o.collected).toFixed(0)} due)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/workorders/${o.id}`} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(orders.length === PAGE_SIZE || page > 1) && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + orders.length}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs rounded-lg transition-colors">
              ← Prev
            </button>
            <span className="px-3 py-1.5 text-xs text-slate-400">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={orders.length < PAGE_SIZE}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs rounded-lg transition-colors">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}