"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UpgradeModal from "@/components/UpgradeModal";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/currency";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";

type WorkOrder = {
  id: string; orderNumber: string; customerName: string; customerPhone: string;
  deviceBrand: string; deviceModel: string; status: string; faultLevel: string;
  isUnderWarranty: boolean; createdAt: string; updatedAt: string;
  assignee: { id: string; name: string } | null;
  total: number; collected: number; tatDays: number; isOverdue: boolean;
  lastReminderAt?: string | null;
  slaDeadline?: string | null;
};

type Engineer = { id: string; name: string };

const FAULT_COLORS: Record<string, string> = {
  LOW: "text-green-600 dark:text-green-400", MEDIUM: "text-yellow-600 dark:text-yellow-400", HIGH: "text-red-600 dark:text-red-400",
};

const STATUS_OPTIONS = ["RECEIVED", "DIAGNOSING", "REPAIRING", "DONE", "DELIVERED", "CANCELLED"];
const PAGE_SIZE = 20;

function orderLabel(o: WorkOrder) {
  return o.orderNumber.startsWith("wo-") ? o.orderNumber.toUpperCase() : o.orderNumber.slice(0, 8).toUpperCase();
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function SlaBadge({ o }: { o: WorkOrder }) {
  if (!o.slaDeadline || ["DELIVERED", "CANCELLED"].includes(o.status)) return null;
  const diffMs = new Date(o.slaDeadline).getTime() - Date.now();
  const diffH = diffMs / (1000 * 60 * 60);
  if (diffMs < 0) return <span className="text-xs bg-red-500/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-bold">SLA</span>;
  if (diffH < 2) return <span className="text-xs bg-orange-500/20 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded font-bold">SLA!</span>;
  return null;
}

function SortableTh({ label, sortField, sortKey, sortDir, onSort }: {
  label: string; sortField: string; sortKey: string; sortDir: "asc" | "desc"; onSort: (k: string) => void;
}) {
  const indicator = sortKey === sortField ? (sortDir === "asc" ? "↑" : "↓") : "↕";
  return (
    <th onClick={() => onSort(sortField)}
      className="text-left px-4 py-3 text-xs text-slate-500 font-medium hover:text-slate-700 dark:hover:text-slate-300"
      style={{ cursor: "pointer", userSelect: "none" }}>
      {label} <span className="text-slate-400">{indicator}</span>
    </th>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const currency = user?.shop?.currency ?? "MAD";
  const fmt = (n: number) => formatCurrency(n, currency);
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [todayAppts, setTodayAppts] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [sortKey, setSortKey] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [visibleCols, setVisibleCols] = useState({
    orderNumber: true, customer: true, device: true, fault: true, status: true,
    assignee: true, total: true, received: true,
  });
  const [showColPicker, setShowColPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [noContactFilter, setNoContactFilter] = useState(false);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkEngineer, setBulkEngineer] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeInfo] = useState({ limit: 50, current: 50 });
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Pull-to-refresh (mobile)
  const touchStartY = useRef(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY > 0) return; // only at top of page
    const distance = e.touches[0].clientY - touchStartY.current;
    if (distance > 0) setPullDistance(Math.min(distance, 80));
  };
  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setRefreshing(true);
      await load();
      setRefreshing(false);
    }
    setPullDistance(0);
  };

  useEffect(() => { setPage(1); }, [search, statusFilter, noContactFilter]);
  useEffect(() => {
    if (!bulkMsg) return;
    const t = setTimeout(() => setBulkMsg(null), 4000);
    return () => clearTimeout(t);
  }, [bulkMsg]);
  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, noContactFilter, page]);

  useEffect(() => {
    fetch("/api/users", { credentials: "include" })
      .then(r => r.json()).then(d => setEngineers(Array.isArray(d) ? d : [])).catch(() => {});
    loadUnread();
    const pollUnread = setInterval(loadUnread, 15000);
    return () => clearInterval(pollUnread);
  }, []);

  async function loadUnread() {
    const res = await fetch("/api/messages/unread", { credentials: "include" });
    if (res.ok) setUnreadCounts(await res.json());
  }

  // Today's appointments + recent activity widgets
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
    fetch(`/api/appointments?start=${start}&end=${end}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setTodayAppts(d.slice(0, 5)); })
      .catch(() => {});
    fetch("/api/activity?limit=10", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setRecentActivity(d); })
      .catch(() => {});
  }, []);

  // Keyboard shortcuts: N = new order, / = focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if (e.key === "n" || e.key === "N") {
        router.push("/dashboard/workorders/new");
      }
      if (e.key === "/") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  function sortValue(o: WorkOrder, key: string): string | number {
    switch (key) {
      case "orderNumber": return orderLabel(o);
      case "customer": return o.customerName;
      case "status": return o.status;
      case "assignee": return o.assignee?.name ?? "";
      case "total": return o.total;
      case "createdAt": return new Date(o.createdAt).getTime();
      default: {
        const v = (o as any)[key];
        return v ?? "";
      }
    }
  }

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (noContactFilter) params.set("noContact", "true");
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
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === orders.length) setSelected(new Set());
    else setSelected(new Set(orders.map(o => o.id)));
  }

  // Runs an operation per selected id, tracking per-item success/failure so a
  // partial failure doesn't silently disappear.
  async function runBulk(
    ids: string[],
    op: (id: string) => Promise<Response>,
    verb: string,
  ) {
    const results = await Promise.all(ids.map(id =>
      op(id)
        .then(res => ({ ok: res.ok }))
        .catch(() => ({ ok: false }))
    ));
    const succeeded = results.filter(r => r.ok).length;
    const failed = results.length - succeeded;
    setBulkMsg(
      failed === 0
        ? `${verb} ${succeeded} order${succeeded === 1 ? "" : "s"}.`
        : `${verb} ${succeeded} order${succeeded === 1 ? "" : "s"}, ${failed} failed.`
    );
  }

  async function applyBulkStatus() {
    if (!bulkStatus || selected.size === 0) return;
    setBulkLoading(true);
    await runBulk([...selected], id =>
      fetch(`/api/workorders/${id}/status`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ status: bulkStatus }),
      }), "Updated");
    setBulkStatus(""); await load(); setBulkLoading(false);
  }

  async function applyBulkEngineer() {
    if (!bulkEngineer || selected.size === 0) return;
    setBulkLoading(true);
    await runBulk([...selected], id =>
      fetch(`/api/workorders/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ assignedTo: bulkEngineer }),
      }), "Assigned");
    setBulkEngineer(""); await load(); setBulkLoading(false);
  }

  async function bulkDelete() {
    setBulkLoading(true);
    await runBulk([...selected], id =>
      fetch(`/api/workorders/${id}/edit`, { method: "DELETE", credentials: "include" }), "Deleted");
    await load(); setBulkLoading(false);
    setDeleteConfirm(false);
  }

  function exportSelected() {
    const selectedOrders = orders.filter(o => selected.has(o.id));
    const csv = [
      ["Order #", "Customer", "Phone", "Device", "Status", "Total", "Date"].join(","),
      ...selectedOrders.map(o => [
        orderLabel(o), o.customerName, o.customerPhone,
        `${o.deviceBrand} ${o.deviceModel}`,
        o.status, o.total.toFixed(2),
        new Date(o.createdAt).toLocaleDateString(),
      ].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "workorders.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const sortedOrders = [...orders].sort((a, b) => {
    const valA = sortValue(a, sortKey);
    const valB = sortValue(b, sortKey);
    let cmp: number;
    if (typeof valA === "number" && typeof valB === "number") cmp = valA - valB;
    else cmp = String(valA).localeCompare(String(valB));
    return sortDir === "asc" ? cmp : -cmp;
  });

  const active = orders.filter(o => !["DELIVERED", "CANCELLED"].includes(o.status));
  const totalRevenue = orders.filter(o => o.status === "DELIVERED").reduce((s, o) => s + o.total, 0);
  const pendingPayment = orders.filter(o => o.status === "DELIVERED").reduce((s, o) => s + (o.total - o.collected), 0);
  const overdue = orders.filter(o => o.isOverdue).length;

  const stats = [
    { label: "Total Orders", value: orders.length, sub: `${active.length} active`, color: "text-slate-900 dark:text-white", icon: "📋", filter: "" },
    { label: "Received", value: orders.filter(o => o.status === "RECEIVED").length, sub: "awaiting diagnosis", color: "text-blue-600 dark:text-blue-400", icon: "📥", filter: "RECEIVED" },
    { label: "In Progress", value: orders.filter(o => ["DIAGNOSING", "REPAIRING"].includes(o.status)).length, sub: `${overdue} overdue`, color: overdue > 0 ? "text-orange-600 dark:text-orange-400" : "text-yellow-600 dark:text-yellow-400", icon: "🔧", filter: "DIAGNOSING" },
    { label: "Ready", value: orders.filter(o => o.status === "DONE").length, sub: "awaiting pickup", color: "text-green-600 dark:text-green-400", icon: "✅", filter: "DONE" },
    { label: "Revenue", value: formatCurrency(totalRevenue, currency, 0), sub: `${formatCurrency(pendingPayment, currency, 0)} pending`, color: "text-emerald-600 dark:text-emerald-400", icon: "💰", filter: null, href: "/dashboard/analytics" },
    { label: "Delivered", value: orders.filter(o => o.status === "DELIVERED").length, sub: "this period", color: "text-slate-500", icon: "📦", filter: "DELIVERED" },
    { label: "Cancelled", value: orders.filter(o => o.status === "CANCELLED").length, sub: "this period", color: "text-red-600 dark:text-red-400", icon: "🚫", filter: "CANCELLED" },
  ];

  const emptyState = (colSpan: number) => (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <div className="space-y-3">
          <p className="text-4xl">📋</p>
          <p className="text-slate-400 font-medium">{search || statusFilter || noContactFilter ? "No orders match your search" : "No work orders yet"}</p>
          <p className="text-slate-400 text-sm">{search || statusFilter || noContactFilter ? "Try a different search or filter" : "Create your first work order to get started"}</p>
          {!search && !statusFilter && !noContactFilter && (
            <Link href="/dashboard/workorders/new" className="inline-block mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors">
              + New Work Order
            </Link>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6"
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {(pullDistance > 0 || refreshing) && (
        <div className="md:hidden" style={{
          textAlign: "center", padding: "8px", fontSize: 13,
          color: "#94a3b8", transform: `translateY(${pullDistance}px)`,
          transition: refreshing ? "none" : "transform 0.2s",
        }}>
          {refreshing ? "🔄 Refreshing..." : pullDistance > 60 ? "↑ Release to refresh" : "↓ Pull to refresh"}
        </div>
      )}
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} feature="work orders" limit={upgradeInfo.limit} current={upgradeInfo.current} />
      )}

      {/* Bulk delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !bulkLoading && setDeleteConfirm(false)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Delete work orders</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Delete {selected.size} order{selected.size === 1 ? "" : "s"}? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(false)} disabled={bulkLoading}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-600 dark:text-slate-300 text-sm rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={bulkDelete} disabled={bulkLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors">
                {bulkLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Work Orders"
        subtitle="Manage all repair jobs"
        actions={
          <>
            <button onClick={() => load()} className="p-2 md:px-3 md:py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-lg transition-colors" title="Refresh">
              <span className="hidden md:inline">🔄 Refresh</span>
              <span className="md:hidden">🔄</span>
            </button>
            <Link href="/dashboard/workorders/new" className="px-3 py-2 md:px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors font-medium whitespace-nowrap">
              <span className="hidden sm:inline">+ New Work Order</span>
              <span className="sm:hidden">+ New</span>
            </Link>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3">
        {stats.map((s) => {
          const cardClass = `bg-white dark:bg-slate-900 border rounded-xl p-3 md:p-4 space-y-1 text-left w-full cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.98] ${
            s.filter !== null && statusFilter === s.filter
              ? "border-blue-500/60 ring-1 ring-blue-500/30"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
          }`;
          const inner = (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 leading-tight">{s.label}</p>
                <span className="text-sm md:text-base">{s.icon}</span>
              </div>
              <p className={`text-lg md:text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400 hidden sm:block">{s.sub}</p>
            </>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className={cardClass}>{inner}</Link>
          ) : (
            <button key={s.label} onClick={() => setStatusFilter(s.filter as string)} className={cardClass}>{inner}</button>
          );
        })}
      </div>

      {/* Today's appointments + Recent activity widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">📅 Today&apos;s Appointments</h2>
            <Link href="/dashboard/appointments" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500">View all →</Link>
          </div>
          {todayAppts.length === 0 ? (
            <p className="text-sm text-slate-400 py-3 text-center">No appointments today</p>
          ) : (
            <div className="space-y-2">
              {todayAppts.map(a => (
                <div key={a.id} className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-xs text-slate-500 w-12 flex-shrink-0">
                    {new Date(a.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-slate-900 dark:text-white font-medium truncate">{a.customerName}</span>
                  <span className="text-xs text-slate-500 truncate">{a.deviceBrand} {a.deviceModel}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">🕑 Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400 py-3 text-center">No recent activity</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentActivity.map(a => (
                <div key={a.id} className="flex items-start gap-2 text-xs">
                  <span className="flex-shrink-0">📝</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-700 dark:text-slate-300 truncate">
                      {a.description || a.action}
                      <span className="text-slate-400 font-mono ml-1">
                        {String(a.orderNumber).startsWith("wo-") ? String(a.orderNumber).toUpperCase() : String(a.orderNumber).slice(0, 8).toUpperCase()}
                      </span>
                    </p>
                    <p className="text-slate-400">{timeAgo(a.createdAt)}{a.userName ? ` · ${a.userName}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <input
        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        placeholder="Search by customer, phone, device, order #..."
        value={search} onChange={(e) => setSearch(e.target.value)} />

      {/* Status filter pills — horizontally scrollable on mobile */}
      <div className="relative md:overflow-visible" style={{ position: "relative" }}>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap scrollbar-none">
          {["", ...STATUS_OPTIONS].map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setNoContactFilter(false); }}
              className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors whitespace-nowrap flex-shrink-0 ${!noContactFilter && statusFilter === s ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600"}`}>
              {s || "All"}
            </button>
          ))}
          <button onClick={() => { setNoContactFilter(v => !v); setStatusFilter(""); }}
            className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors whitespace-nowrap flex-shrink-0 ${noContactFilter ? "bg-amber-600 text-white border-amber-600" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600"}`}>
            ⏰ No contact 3d+
          </button>
        </div>
        {/* Right-edge fade hint — only relevant while pills scroll on mobile */}
        <div className="md:hidden" style={{ position: "absolute", right: 0, top: 0, bottom: 4, width: 40, background: "linear-gradient(to right, transparent, #0f172a)", pointerEvents: "none" }} />
      </div>

      {/* Bulk result message */}
      {bulkMsg && (
        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-700 dark:text-slate-300">
          {bulkMsg}
        </div>
      )}

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800/50 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">{selected.size} selected</span>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none">
              <option value="">Change status...</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={applyBulkStatus} disabled={!bulkStatus || bulkLoading}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg">Apply</button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={bulkEngineer} onChange={e => setBulkEngineer(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none">
              <option value="">Assign engineer...</option>
              {engineers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <button onClick={applyBulkEngineer} disabled={!bulkEngineer || bulkLoading}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg">Assign</button>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <button onClick={exportSelected} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition-colors">
              ⬇ Export ({selected.size})
            </button>
            <button onClick={() => setDeleteConfirm(true)} disabled={bulkLoading}
              className="px-3 py-1.5 bg-red-100 dark:bg-red-700/40 hover:bg-red-200 dark:hover:bg-red-700/70 disabled:opacity-50 text-red-600 dark:text-red-400 text-xs rounded-lg transition-colors">
              🗑 Delete ({selected.size})
            </button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">✕</button>
          </div>
        </div>
      )}

      {/* ── Mobile card list ── */}
      <div className="md:hidden space-y-3">
        {loading && [...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 animate-pulse">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1.5">
                <div className={`h-3 bg-slate-200 dark:bg-slate-800 rounded ${["w-12","w-16","w-10","w-14"][i % 4]}`} />
                <div className={`h-4 bg-slate-200 dark:bg-slate-700 rounded ${["w-32","w-28","w-36","w-24"][i % 4]}`} />
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full flex-shrink-0" />
            </div>
            <div className={`h-3 bg-slate-200 dark:bg-slate-800 rounded ${["w-24","w-20","w-28","w-16"][i % 4]}`} />
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/60">
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
        ))}
        {!loading && orders.length === 0 && (
          <div className="py-12 text-center space-y-3">
            <p className="text-4xl">📋</p>
            <p className="text-slate-400 font-medium">{search || statusFilter || noContactFilter ? "No orders match your search" : "No work orders yet"}</p>
            <p className="text-slate-400 text-sm">{search || statusFilter || noContactFilter ? "Try a different search or filter" : "Create your first work order to get started"}</p>
            {!search && !statusFilter && !noContactFilter && (
              <Link href="/dashboard/workorders/new" className="inline-block mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors">
                + New Work Order
              </Link>
            )}
          </div>
        )}

        {/* Select all bar — only shown when ≥1 order */}
        {!loading && orders.length > 0 && (
          <div className="flex items-center gap-2 px-1">
            <input type="checkbox" checked={orders.length > 0 && selected.size === orders.length}
              onChange={toggleSelectAll} className="rounded border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 cursor-pointer" />
            <span className="text-xs text-slate-500">Select all</span>
          </div>
        )}

        {sortedOrders.map((o, i) => (
          <div key={o.id}
            className={`fade-in card-hover bg-white dark:bg-slate-900 border rounded-xl p-4 space-y-3 ${selected.has(o.id) ? "border-blue-600/50 bg-blue-50 dark:bg-blue-950/20" : "border-slate-200 dark:border-slate-800"}`}
            style={{ animationDelay: `${i * 35}ms` }}>
            {/* Row 1: checkbox + order # + badges + status */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSelect(o.id)}
                  className="rounded border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 cursor-pointer flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-mono text-xs text-slate-400">{orderLabel(o)}</span>
                  {o.isUnderWarranty && <span className="ml-1.5 text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">W</span>}
                  {o.isOverdue && <span className="ml-1 text-xs bg-orange-500/20 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded">⚠</span>}
                  <span className="ml-1"><SlaBadge o={o} /></span>
                  {unreadCounts[o.id] > 0 && (
                    <span className="ml-1.5 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {unreadCounts[o.id]}
                    </span>
                  )}
                </div>
              </div>
              <span className="flex-shrink-0"><StatusBadge status={o.status} /></span>
            </div>

            {/* Row 2: customer */}
            <div>
              <p className="text-slate-900 dark:text-white font-medium text-sm">{o.customerName}</p>
              <p className="text-xs text-slate-500">{o.customerPhone}</p>
            </div>

            {/* Row 3: device + fault */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700 dark:text-slate-300">{o.deviceBrand} {o.deviceModel}</p>
                {o.assignee && <p className="text-xs text-slate-500 mt-0.5">👤 {o.assignee.name}</p>}
              </div>
              <span className={`text-xs font-semibold ${FAULT_COLORS[o.faultLevel]}`}>{o.faultLevel}</span>
            </div>

            {/* Row 4: amount + date + link */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-700 dark:text-slate-300 font-medium">{o.total > 0 ? formatCurrency(o.total, currency, 0) : "—"}</span>
                {o.total > o.collected && o.status === "DELIVERED" && (
                  <span className="text-red-600 dark:text-red-400">({(o.total - o.collected).toFixed(0)} due)</span>
                )}
                <span className="text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</span>
              </div>
              <Link href={`/dashboard/workorders/${o.id}`}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium transition-colors">
                View →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:flex items-center justify-end">
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowColPicker(o => !o)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Columns ▾
          </button>
          {showColPicker && (
            <>
              <div onClick={() => setShowColPicker(false)} style={{ position: "fixed", inset: 0, zIndex: 20 }} />
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                style={{ position: "absolute", top: "100%", right: 0, zIndex: 30, borderRadius: 10, padding: 8, minWidth: 170, marginTop: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
                {Object.keys(visibleCols).map(col => (
                  <label key={col} className="text-slate-700 dark:text-slate-300" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", cursor: "pointer", fontSize: 13 }}>
                    <input type="checkbox"
                      checked={visibleCols[col as keyof typeof visibleCols]}
                      onChange={() => setVisibleCols(v => ({ ...v, [col]: !v[col as keyof typeof v] }))} />
                    {col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, " $1")}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="px-4 py-3 w-8">
                <input type="checkbox" checked={orders.length > 0 && selected.size === orders.length}
                  onChange={toggleSelectAll} className="rounded border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 cursor-pointer" />
              </th>
              {visibleCols.orderNumber && <SortableTh label="Order #" sortField="orderNumber" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />}
              {visibleCols.customer && <SortableTh label="Customer" sortField="customer" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />}
              {visibleCols.device && <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Device</th>}
              {visibleCols.fault && <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Fault</th>}
              {visibleCols.status && <SortableTh label="Status" sortField="status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />}
              {visibleCols.assignee && <SortableTh label="Assigned To" sortField="assignee" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />}
              {visibleCols.total && <SortableTh label="Total" sortField="total" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />}
              {visibleCols.received && <SortableTh label="Date" sortField="createdAt" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />}
              <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && [...Array(6)].map((_, i) => (
              <tr key={i} className="border-b border-slate-200/50 dark:border-slate-800/50 animate-pulse">
                <td className="px-4 py-3.5"><div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                <td className="px-4 py-3.5"><div className={`h-3 bg-slate-200 dark:bg-slate-800 rounded ${["w-20","w-24","w-16","w-20","w-18","w-22"][i]}`} /></td>
                <td className="px-4 py-3.5 space-y-1.5"><div className={`h-3 bg-slate-200 dark:bg-slate-700 rounded ${["w-28","w-24","w-32","w-28","w-20","w-30"][i]}`} /><div className="h-2 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                <td className="px-4 py-3.5 space-y-1.5"><div className={`h-3 bg-slate-200 dark:bg-slate-800 rounded ${["w-20","w-16","w-24","w-18","w-22","w-16"][i]}`} /><div className="h-2 w-14 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                <td className="px-4 py-3.5"><div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                <td className="px-4 py-3.5"><div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
                <td className="px-4 py-3.5"><div className={`h-3 bg-slate-200 dark:bg-slate-800 rounded ${["w-16","w-12","w-20","w-14","w-18","w-12"][i]}`} /></td>
                <td className="px-4 py-3.5"><div className="h-3 w-14 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                <td className="px-4 py-3.5"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                <td className="px-4 py-3.5"><div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded" /></td>
              </tr>
            ))}
            {!loading && orders.length === 0 && emptyState(10)}
            {sortedOrders.map((o, i) => (
              <tr key={o.id} className={`fade-in row-hover border-b border-slate-200/50 dark:border-slate-800/50 ${selected.has(o.id) ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
                style={{ animationDelay: `${i * 30}ms` }}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSelect(o.id)}
                    className="rounded border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 cursor-pointer" />
                </td>
                {visibleCols.orderNumber && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs text-slate-400">{orderLabel(o)}</span>
                      {o.isUnderWarranty && <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">W</span>}
                      {o.isOverdue && <span className="text-xs bg-orange-500/20 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded">⚠</span>}
                      <SlaBadge o={o} />
                      {unreadCounts[o.id] > 0 && (
                        <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                          💬 {unreadCounts[o.id]}
                        </span>
                      )}
                    </div>
                  </td>
                )}
                {visibleCols.customer && (
                  <td className="px-4 py-3">
                    <div className="text-slate-900 dark:text-white font-medium">{o.customerName}</div>
                    <div className="text-xs text-slate-500">{o.customerPhone}</div>
                  </td>
                )}
                {visibleCols.device && (
                  <td className="px-4 py-3">
                    <div className="text-slate-900 dark:text-white">{o.deviceBrand}</div>
                    <div className="text-xs text-slate-500">{o.deviceModel}</div>
                  </td>
                )}
                {visibleCols.fault && (
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${FAULT_COLORS[o.faultLevel]}`}>{o.faultLevel}</span>
                  </td>
                )}
                {visibleCols.status && (
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                )}
                {visibleCols.assignee && (
                  <td className="px-4 py-3 text-slate-400 text-xs">{o.assignee?.name ?? "—"}</td>
                )}
                {visibleCols.total && (
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-xs font-medium">
                    {o.total > 0 ? formatCurrency(o.total, currency, 0) : "—"}
                    {o.total > o.collected && o.status === "DELIVERED" && (
                      <span className="text-red-600 dark:text-red-400 ml-1 text-xs">({(o.total - o.collected).toFixed(0)} due)</span>
                    )}
                  </td>
                )}
                {visibleCols.received && (
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                )}
                <td className="px-4 py-3">
                  <Link href={`/dashboard/workorders/${o.id}`} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(orders.length === PAGE_SIZE || page > 1) && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Showing {(page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + orders.length}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition-colors">← Prev</button>
            <span className="px-3 py-1.5 text-xs text-slate-400">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={orders.length < PAGE_SIZE}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition-colors">Next →</button>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <p className="hidden md:block text-center text-slate-400 dark:text-slate-600" style={{ fontSize: 11, marginTop: 8 }}>
        Press <kbd className="bg-slate-100 dark:bg-slate-800" style={{ padding: "1px 5px", borderRadius: 4, fontSize: 10 }}>N</kbd> for new order ·{" "}
        <kbd className="bg-slate-100 dark:bg-slate-800" style={{ padding: "1px 5px", borderRadius: 4, fontSize: 10 }}>/</kbd> to search ·{" "}
        <kbd className="bg-slate-100 dark:bg-slate-800" style={{ padding: "1px 5px", borderRadius: 4, fontSize: 10 }}>Ctrl+K</kbd> command palette
      </p>
    </div>
  );
}
