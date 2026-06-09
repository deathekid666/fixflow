"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  name: string; phone: string; email: string;
  totalOrders: number; totalSpent: number; totalCollected: number;
  lastVisit: string; statuses: string[];
};

type SortKey = "totalOrders" | "totalSpent" | "lastVisit" | "name";

function loyaltyTier(orders: number): { label: string; className: string } | null {
  if (orders >= 5) return { label: "⭐ VIP", className: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" };
  if (orders >= 3) return { label: "⭐ Loyal", className: "bg-amber-500/20 text-amber-400 border border-amber-500/30" };
  if (orders >= 2) return { label: "Repeat", className: "bg-blue-500/20 text-blue-400" };
  return null;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("totalOrders");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/customers?${params}`, { credentials: "include" });
    const data = await res.json();
    setCustomers(Array.isArray(data) ? data : []);
    setLoading(false);
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

  function SortIcon({ k }: { k: SortKey }) {
    if (sortBy !== k) return <span className="text-slate-700 ml-1">↕</span>;
    return <span className="text-blue-400 ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Customers</h1>
        <p className="text-sm text-slate-500 mt-0.5">Customer profiles and repair history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total Customers</p>
          <p className="text-2xl font-bold text-white">{totalCustomers}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Loyal (3+ orders)</p>
          <p className="text-2xl font-bold text-amber-400">{loyalCustomers}</p>
          <p className="text-xs text-slate-600 mt-1">{totalCustomers > 0 ? Math.round((loyalCustomers / totalCustomers) * 100) : 0}% of base</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total Billed</p>
          <p className="text-2xl font-bold text-white">{totalRevenue.toFixed(0)} <span className="text-sm font-normal text-slate-500">MAD</span></p>
        </div>
        <div className={`border rounded-xl p-4 ${outstanding > 0 ? "bg-red-500/10 border-red-500/20" : "bg-slate-900 border-slate-800"}`}>
          <p className="text-xs text-slate-500 mb-1">Outstanding</p>
          <p className={`text-2xl font-bold ${outstanding > 0 ? "text-red-400" : "text-slate-400"}`}>{outstanding.toFixed(0)} <span className="text-sm font-normal text-slate-500">MAD</span></p>
        </div>
      </div>

      {/* Search */}
      <input
        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        placeholder="Search by name, phone or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* ── Mobile card list ── */}
      <div className="md:hidden space-y-3">
        {loading && [...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 animate-pulse">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1.5">
                <div className={`h-4 bg-slate-700 rounded ${["w-32","w-28","w-36","w-24"][i]}`} />
                <div className={`h-3 bg-slate-800 rounded ${["w-24","w-20","w-28","w-20"][i]}`} />
              </div>
              <div className="h-3 w-10 bg-slate-800 rounded" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="h-12 bg-slate-800/60 rounded-lg" />
              <div className="h-12 bg-slate-800/60 rounded-lg" />
              <div className="h-12 bg-slate-800/60 rounded-lg" />
            </div>
          </div>
        ))}
        {!loading && sorted.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-4xl mb-3">👤</p>
            <p className="text-slate-400 font-medium">{search ? "No customers match your search" : "No customers yet"}</p>
            <p className="text-slate-600 text-sm mt-1">{search ? "Try a different search" : "Customers appear automatically when you create work orders"}</p>
          </div>
        )}
        {sorted.map((c, i) => {
          const badge = loyaltyTier(c.totalOrders);
          const due = c.totalSpent - c.totalCollected;
          return (
            <div key={c.phone}
              onClick={() => router.push(`/dashboard/customers/${encodeURIComponent(c.phone)}`)}
              className="fade-in bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 active:bg-slate-800 cursor-pointer"
              style={{ animationDelay: `${i * 40}ms` }}>
              {/* Name + badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium">{c.name}</span>
                    {badge && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${badge.className}`}>{badge.label}</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{c.email || c.phone}</div>
                </div>
                <span className="text-xs text-blue-400 flex-shrink-0 mt-1">View →</span>
              </div>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-800/50 rounded-lg py-2">
                  <p className="text-base font-bold text-white">{c.totalOrders}</p>
                  <p className="text-xs text-slate-500">visits</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg py-2">
                  <p className="text-base font-bold text-slate-200">{c.totalSpent.toFixed(0)}</p>
                  <p className="text-xs text-slate-500">MAD spent</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg py-2">
                  <p className="text-base font-bold text-slate-300">{new Date(c.lastVisit).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                  <p className="text-xs text-slate-500">last visit</p>
                </div>
              </div>
              {/* Outstanding */}
              {due > 0.01 && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 rounded-lg px-2 py-1.5">
                  <span>⚠</span>
                  <span>{due.toFixed(0)} MAD outstanding</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">
                <button onClick={() => toggleSort("name")} className="flex items-center hover:text-slate-300 transition-colors">
                  Customer <SortIcon k="name" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Phone</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">
                <button onClick={() => toggleSort("totalOrders")} className="flex items-center hover:text-slate-300 transition-colors">
                  Visits <SortIcon k="totalOrders" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">
                <button onClick={() => toggleSort("totalSpent")} className="flex items-center hover:text-slate-300 transition-colors">
                  Total Spent <SortIcon k="totalSpent" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Collected</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">
                <button onClick={() => toggleSort("lastVisit")} className="flex items-center hover:text-slate-300 transition-colors">
                  Last Visit <SortIcon k="lastVisit" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Loyalty</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading && [...Array(6)].map((_, i) => (
              <tr key={i} className="border-b border-slate-800/50 animate-pulse">
                <td className="px-4 py-3.5 space-y-1.5"><div className={`h-3 bg-slate-700 rounded ${["w-28","w-32","w-24","w-36","w-28","w-30"][i]}`} /><div className="h-2 w-20 bg-slate-800 rounded" /></td>
                <td className="px-4 py-3.5"><div className={`h-3 bg-slate-800 rounded ${["w-24","w-28","w-20","w-24","w-28","w-20"][i]}`} /></td>
                <td className="px-4 py-3.5"><div className="h-3 w-8 bg-slate-800 rounded" /></td>
                <td className="px-4 py-3.5"><div className={`h-3 bg-slate-800 rounded ${["w-20","w-16","w-24","w-18","w-20","w-16"][i]}`} /></td>
                <td className="px-4 py-3.5"><div className="h-3 w-16 bg-slate-800 rounded" /></td>
                <td className="px-4 py-3.5"><div className="h-3 w-20 bg-slate-800 rounded" /></td>
                <td className="px-4 py-3.5"><div className="h-5 w-14 bg-slate-800 rounded-full" /></td>
                <td className="px-4 py-3.5"><div className="h-3 w-10 bg-slate-800 rounded" /></td>
              </tr>
            ))}
            {!loading && sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <p className="text-4xl mb-3">👤</p>
                  <p className="text-slate-400 font-medium">{search ? "No customers match your search" : "No customers yet"}</p>
                  <p className="text-slate-600 text-sm mt-1">{search ? "Try a different search" : "Customers appear automatically when you create work orders"}</p>
                </td>
              </tr>
            )}
            {sorted.map((c, i) => {
              const badge = loyaltyTier(c.totalOrders);
              const due = c.totalSpent - c.totalCollected;
              return (
                <tr key={c.phone} className="fade-in border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                  style={{ animationDelay: `${i * 30}ms` }}
                  onClick={() => router.push(`/dashboard/customers/${encodeURIComponent(c.phone)}`)}>
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.email || "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{c.phone}</td>
                  <td className="px-4 py-3">
                    <span className="text-white font-semibold">{c.totalOrders}</span>
                    <span className="text-xs text-slate-500 ml-1">visit{c.totalOrders !== 1 ? "s" : ""}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white font-medium">{c.totalSpent.toFixed(2)} MAD</span>
                    {due > 0.01 && <div className="text-xs text-red-400 mt-0.5">{due.toFixed(0)} due</div>}
                  </td>
                  <td className="px-4 py-3 text-green-400 font-medium">{c.totalCollected.toFixed(2)} MAD</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(c.lastVisit).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {badge ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>{badge.label}</span>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View →</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
