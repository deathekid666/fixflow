"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loyaltyTier } from "@/lib/loyaltyTier";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/currency";
import { PageHeader } from "@/components/PageHeader";
import { REFERRAL_LABELS, REFERRAL_BADGE_CLASS } from "@/lib/referralSources";
import { useLanguage } from "@/context/LanguageContext";

type Customer = {
  name: string; phone: string; email: string;
  totalOrders: number; totalSpent: number; totalCollected: number;
  firstVisit: string; lastVisit: string; statuses: string[];
  referralSource?: string | null;
};

function customerSince(firstVisit: string): string {
  const d = new Date(firstVisit);
  const now = new Date();
  const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  if (months < 1) return "New";
  if (months < 12) return `${months}mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}y ${rem}mo` : `${years}y`;
}

type SortKey = "totalOrders" | "totalSpent" | "lastVisit" | "name";

export default function CustomersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const currency = user?.shop?.currency ?? "MAD";
  const fmt = (n: number) => formatCurrency(n, currency);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("totalOrders");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [tierFilter, setTierFilter] = useState<"bronze" | "silver" | "gold" | null>(null);
  const [editingPhone, setEditingPhone] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/customers?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load customers. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function openEdit(c: Customer, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingPhone(c.phone);
    setEditForm({ name: c.name, email: c.email ?? "" });
  }

  async function handleDelete(phone: string, name: string, ev: React.MouseEvent) {
    ev.stopPropagation();
    if (!confirm(`Delete ${name} and all their work order history? This cannot be undone.`)) return;
    const res = await fetch("/api/customers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ phone }),
    });
    if (res.ok) setCustomers(prev => prev.filter(c => c.phone !== phone));
  }

  async function saveEdit(e: React.MouseEvent) {
    e.stopPropagation();
    if (!editingPhone || !editForm.name.trim()) return;
    setSavingEdit(true);
    const res = await fetch("/api/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ phone: editingPhone, name: editForm.name, email: editForm.email }),
    });
    if (res.ok) {
      setCustomers(prev => prev.map(c =>
        c.phone === editingPhone ? { ...c, name: editForm.name.trim(), email: editForm.email.trim() } : c
      ));
      setEditingPhone(null);
    }
    setSavingEdit(false);
  }

  function toggleSort(key: SortKey) {
    if (sortBy === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(key); setSortDir("desc"); }
  }

  const sorted = [...customers].sort((a, b) => {
    let av: number | string, bv: number | string;
    if (sortBy === "lastVisit") { av = a.lastVisit; bv = b.lastVisit; }
    else if (sortBy === "name") { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
    else { av = a[sortBy]; bv = b[sortBy]; }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalCustomers = customers.length;
  const loyalCustomers = customers.filter(c => c.totalOrders >= 3).length;
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const outstanding = customers.reduce((s, c) => s + (c.totalSpent - c.totalCollected), 0);
  const bronzeCount = customers.filter(c => c.totalOrders >= 1 && c.totalOrders <= 2).length;
  const silverCount = customers.filter(c => c.totalOrders >= 3 && c.totalOrders <= 5).length;
  const goldCount   = customers.filter(c => c.totalOrders >= 6).length;

  const now = new Date();
  const anniversaryCount = customers.filter(c => {
    if (!c.firstVisit) return false;
    const d = new Date(c.firstVisit);
    return d.getMonth() === now.getMonth() && d.getFullYear() < now.getFullYear();
  }).length;
  const tenPlusCount = customers.filter(c => c.totalOrders >= 10).length;

  const displayed = sorted.filter(c => {
    if (!tierFilter) return true;
    if (tierFilter === "bronze") return c.totalOrders >= 1 && c.totalOrders <= 2;
    if (tierFilter === "silver") return c.totalOrders >= 3 && c.totalOrders <= 5;
    return c.totalOrders >= 6;
  });

  function SortIcon({ k }: { k: SortKey }) {
    if (sortBy !== k) return <span className="text-slate-700 ml-1">↕</span>;
    return <span className="text-blue-400 ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <PageHeader title={t("customers")} subtitle="Customer profiles and repair history" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total Customers</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalCustomers}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Loyal (3+ orders)</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{loyalCustomers}</p>
          <p className="text-xs text-slate-400 mt-1">{totalCustomers > 0 ? Math.round((loyalCustomers / totalCustomers) * 100) : 0}% of base</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total Billed</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalRevenue, currency, 0)}</p>
        </div>
        <div className={`border rounded-xl p-4 ${outstanding > 0 ? "bg-red-500/10 border-red-500/20" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"}`}>
          <p className="text-xs text-slate-500 mb-1">Outstanding</p>
          <p className={`text-2xl font-bold ${outstanding > 0 ? "text-red-600 dark:text-red-400" : "text-slate-500"}`}>{formatCurrency(outstanding, currency, 0)}</p>
        </div>
      </div>

      {/* Loyalty tiers */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-3">
          {([
            { key: "bronze" as const, emoji: "🥉", label: "Bronze", count: bronzeCount, range: "1–2 orders", base: "bg-orange-600/8 border-orange-500/20", text: "text-orange-700 dark:text-orange-400" },
            { key: "silver" as const, emoji: "🥈", label: "Silver", count: silverCount, range: "3–5 orders", base: "bg-slate-400/8 border-slate-400/25",   text: "text-slate-500 dark:text-slate-300" },
            { key: "gold"   as const, emoji: "🥇", label: "Gold",   count: goldCount,   range: "6+ orders",  base: "bg-yellow-500/10 border-yellow-500/20", text: "text-yellow-600 dark:text-yellow-400" },
          ]).map(({ key, emoji, label, count, range, base, text }) => {
            const isActive = tierFilter === key;
            return (
              <button
                key={key}
                onClick={() => setTierFilter(isActive ? null : key)}
                className={`text-left w-full rounded-xl p-4 border transition-all duration-150 ${base} ${
                  isActive
                    ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-950 brightness-105"
                    : "hover:brightness-95 dark:hover:brightness-110"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl leading-none">{emoji}</span>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${text}`}>{label}</p>
                  </div>
                  {isActive && <span className="text-blue-500 text-xs font-bold">✓</span>}
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
                <p className="text-xs text-slate-500 mt-1">{range}</p>
              </button>
            );
          })}
        </div>
        {tierFilter && (
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-0.5">
            <span>Filtering by <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{tierFilter}</span></span>
            <span>·</span>
            <button onClick={() => setTierFilter(null)} className="text-blue-500 hover:text-blue-400 transition-colors font-medium">
              All customers
            </button>
          </div>
        )}
      </div>

      {/* Loyalty Milestones */}
      {(anniversaryCount > 0 || tenPlusCount > 0) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Loyalty Milestones</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{anniversaryCount}</p>
              <p className="text-xs text-slate-500 mt-1">Anniversaries this month</p>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{tenPlusCount}</p>
              <p className="text-xs text-slate-500 mt-1">10+ order customers</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-xl">
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{goldCount}</p>
              <p className="text-xs text-slate-500 mt-1">Gold VIP (6+)</p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <input
        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        placeholder={t("searchCustomers")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)",
          borderRadius: 16, margin: "20px 0",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <p style={{ color: "#f87171", fontWeight: 600, fontSize: 16, margin: "0 0 6px" }}>Something went wrong</p>
          <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 20px" }}>{error}</p>
          <button onClick={() => { setError(""); load(); }} style={{
            background: "#2563eb", color: "white", border: "none", borderRadius: 8,
            padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>
            Try again
          </button>
        </div>
      )}

      {/* ── Mobile card list ── */}
      <div className={`md:hidden space-y-3 ${error ? "hidden" : ""}`}>
        {loading && [...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 animate-pulse">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1.5">
                <div className={`h-4 bg-slate-200 dark:bg-slate-700 rounded ${["w-32","w-28","w-36","w-24"][i]}`} />
                <div className={`h-3 bg-slate-200 dark:bg-slate-800 rounded ${["w-24","w-20","w-28","w-20"][i]}`} />
              </div>
              <div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
              <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
              <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
            </div>
          </div>
        ))}
        {!loading && displayed.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-4xl mb-3">👤</p>
            <p className="text-slate-400 font-medium">
              {tierFilter ? `No ${tierFilter} customers` : search ? "No customers match your search" : "No customers yet"}
            </p>
            {tierFilter ? (
              <button onClick={() => setTierFilter(null)} className="text-blue-400 hover:text-blue-300 transition-colors text-sm mt-1">Show all customers</button>
            ) : (
              <p className="text-slate-600 text-sm mt-1">{search ? "Try a different search" : "Customers appear automatically when you create work orders"}</p>
            )}
          </div>
        )}
        {displayed.map((c, i) => {
          const badge = loyaltyTier(c.totalOrders);
          const due = c.totalSpent - c.totalCollected;
          const isEditing = editingPhone === c.phone;
          return (
            <div key={c.phone}
              onClick={() => !isEditing && router.push(`/dashboard/customers/${encodeURIComponent(c.phone)}`)}
              className="fade-in card-hover bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 active:bg-slate-50 dark:active:bg-slate-800 cursor-pointer"
              style={{ animationDelay: `${i * 40}ms` }}>
              {/* Name + badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-900 dark:text-white font-medium">{c.name}</span>
                    {badge && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${badge.className}`}>{badge.label}</span>
                    )}
                    {c.referralSource && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${REFERRAL_BADGE_CLASS[c.referralSource] ?? ""}`}>
                        {REFERRAL_LABELS[c.referralSource] ?? c.referralSource}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{c.email || c.phone}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 mt-1" onClick={e => e.stopPropagation()}>
                  <button onClick={e => isEditing ? (e.stopPropagation(), setEditingPhone(null)) : openEdit(c, e)}
                    className={`text-xs transition-colors ${isEditing ? "text-blue-500 font-medium" : "text-slate-400 hover:text-blue-500"}`}>
                    {isEditing ? "✕" : t("edit")}
                  </button>
                  <button onClick={e => handleDelete(c.phone, c.name, e)}
                    className="text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">{t("deleteBtn")}</button>
                  <span className="text-xs text-blue-400" onClick={e => { e.stopPropagation(); router.push(`/dashboard/customers/${encodeURIComponent(c.phone)}`); }}>{t("view")} →</span>
                </div>
              </div>
              {isEditing && (
                <div className="space-y-2 pt-1" onClick={e => e.stopPropagation()}>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Name *</label>
                      <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Email</label>
                      <input value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="Optional"
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={savingEdit || !editForm.name.trim()}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg font-medium transition-colors">
                      {savingEdit ? t("saving") : t("save")}
                    </button>
                    <button onClick={e => { e.stopPropagation(); setEditingPhone(null); }}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs rounded-lg">
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              )}
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg py-2">
                  <p className="text-base font-bold text-slate-900 dark:text-white">{c.totalOrders}</p>
                  <p className="text-xs text-slate-500">visits</p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg py-2">
                  <p className="text-base font-bold text-slate-700 dark:text-slate-200">{c.totalSpent.toFixed(0)}</p>
                  <p className="text-xs text-slate-500">{currency} spent</p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg py-2">
                  <p className="text-base font-bold text-slate-600 dark:text-slate-300">{new Date(c.lastVisit).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                  <p className="text-xs text-slate-500">last visit</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg py-2">
                  <p className="text-base font-bold text-purple-600 dark:text-purple-400">{customerSince(c.firstVisit)}</p>
                  <p className="text-xs text-slate-500">since</p>
                </div>
              </div>
              {/* Outstanding */}
              {due > 0.01 && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 rounded-lg px-2 py-1.5">
                  <span>⚠</span>
                  <span>{formatCurrency(due, currency, 0)} outstanding</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Desktop table ── */}
      <div className={`hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden ${error ? "md:hidden" : ""}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">
                <button onClick={() => toggleSort("name")} className="flex items-center hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  {t("customer")} <SortIcon k="name" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">{t("phone")}</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">
                <button onClick={() => toggleSort("totalOrders")} className="flex items-center hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  Visits <SortIcon k="totalOrders" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">
                <button onClick={() => toggleSort("totalSpent")} className="flex items-center hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  Total Spent <SortIcon k="totalSpent" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Collected</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">
                <button onClick={() => toggleSort("lastVisit")} className="flex items-center hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  Last Visit <SortIcon k="lastVisit" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Customer Since</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Loyalty</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading && [...Array(6)].map((_, i) => (
              <tr key={i} className="border-b border-slate-200/50 dark:border-slate-800/50 animate-pulse">
                <td className="px-4 py-3.5 space-y-1.5"><div className={`h-3 bg-slate-200 dark:bg-slate-700 rounded ${["w-28","w-32","w-24","w-36","w-28","w-30"][i]}`} /><div className="h-2 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                <td className="px-4 py-3.5"><div className={`h-3 bg-slate-200 dark:bg-slate-800 rounded ${["w-24","w-28","w-20","w-24","w-28","w-20"][i]}`} /></td>
                <td className="px-4 py-3.5"><div className="h-3 w-8 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                <td className="px-4 py-3.5"><div className={`h-3 bg-slate-200 dark:bg-slate-800 rounded ${["w-20","w-16","w-24","w-18","w-20","w-16"][i]}`} /></td>
                <td className="px-4 py-3.5"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                <td className="px-4 py-3.5"><div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                <td className="px-4 py-3.5"><div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                <td className="px-4 py-3.5"><div className="h-5 w-14 bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
                <td className="px-4 py-3.5"><div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded" /></td>
              </tr>
            ))}
            {!loading && displayed.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <p className="text-4xl mb-3">👤</p>
                  <p className="text-slate-400 font-medium">
                    {tierFilter ? `No ${tierFilter} customers` : search ? "No customers match your search" : "No customers yet"}
                  </p>
                  {tierFilter ? (
                    <button onClick={() => setTierFilter(null)} className="text-blue-400 hover:text-blue-300 transition-colors text-sm mt-1">Show all customers</button>
                  ) : (
                    <p className="text-slate-600 text-sm mt-1">{search ? "Try a different search" : "Customers appear automatically when you create work orders"}</p>
                  )}
                </td>
              </tr>
            )}
            {displayed.map((c, i) => {
              const badge = loyaltyTier(c.totalOrders);
              const due = c.totalSpent - c.totalCollected;
              const isEditing = editingPhone === c.phone;
              return (
                <>
                  <tr key={c.phone} className="fade-in border-b border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                    style={{ animationDelay: `${i * 30}ms` }}
                    onClick={() => !isEditing && router.push(`/dashboard/customers/${encodeURIComponent(c.phone)}`)}>
                    <td className="px-4 py-3">
                      <div className="text-slate-900 dark:text-white font-medium">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.email || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-sm">{c.phone}</td>
                    <td className="px-4 py-3">
                      <span className="text-slate-900 dark:text-white font-semibold">{c.totalOrders}</span>
                      <span className="text-xs text-slate-500 ml-1">visit{c.totalOrders !== 1 ? "s" : ""}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-900 dark:text-white font-medium">{fmt(c.totalSpent)}</span>
                      {due > 0.01 && <div className="text-xs text-red-600 dark:text-red-400 mt-0.5">{formatCurrency(due, currency, 0)} due</div>}
                    </td>
                    <td className="px-4 py-3 text-green-600 dark:text-green-400 font-medium">{fmt(c.totalCollected)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(c.lastVisit).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs text-purple-600 dark:text-purple-400 font-medium">{customerSince(c.firstVisit)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {badge ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>{badge.label}</span>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                        {c.referralSource && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REFERRAL_BADGE_CLASS[c.referralSource] ?? ""}`}>
                            {REFERRAL_LABELS[c.referralSource] ?? c.referralSource}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        <button onClick={e => isEditing ? (e.stopPropagation(), setEditingPhone(null)) : openEdit(c, e)}
                          className={`text-xs transition-colors ${isEditing ? "text-blue-500" : "text-slate-400 hover:text-blue-500 dark:hover:text-blue-400"}`}>
                          Edit
                        </button>
                        <button onClick={e => handleDelete(c.phone, c.name, e)}
                          className="text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">{t("deleteBtn")}</button>
                        <button onClick={e => { e.stopPropagation(); router.push(`/dashboard/customers/${encodeURIComponent(c.phone)}`); }}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors">{t("view")} →</button>
                      </div>
                    </td>
                  </tr>
                  {isEditing && (
                    <tr key={`edit-${c.phone}`} className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                      <td colSpan={9} className="px-4 py-4">
                        <div className="flex items-end gap-3 flex-wrap">
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Name *</label>
                            <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 w-48" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Email</label>
                            <input value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                              placeholder="Optional"
                              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={saveEdit} disabled={savingEdit || !editForm.name.trim()}
                              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg font-medium transition-colors">
                              {savingEdit ? t("saving") : t("save")}
                            </button>
                            <button onClick={e => { e.stopPropagation(); setEditingPhone(null); }}
                              className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg">
                              {t("cancel")}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 50,
            width: 44, height: 44, borderRadius: "50%",
            background: "#2563eb", border: "none", color: "white",
            fontSize: 20, cursor: "pointer", boxShadow: "0 4px 16px rgba(37,99,235,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "opacity 0.2s",
          }}
          aria-label="Back to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}
