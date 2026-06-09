"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  totalCollected: number;
  lastVisit: string;
  statuses: string[];
};

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/customers?${params}`);
    setCustomers(await res.json());
    setLoading(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Customers</h1>
        <p className="text-sm text-slate-500 mt-0.5">Customer profiles and repair history</p>
      </div>

      <input
        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        placeholder="Search by name, phone or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              {["Customer", "Phone", "Orders", "Total Spent", "Collected", "Last Visit", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>}
            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <p className="text-4xl mb-3">👤</p>
                  <p className="text-slate-400 font-medium">{search ? "No customers match your search" : "No customers yet"}</p>
                  <p className="text-slate-600 text-sm mt-1">{search ? "Try a different search" : "Customers appear automatically when you create work orders"}</p>
                </td>
              </tr>
            )}
            {customers.map((c) => (
              <tr key={c.phone} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="text-white font-medium">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.email || "—"}</div>
                </td>
                <td className="px-4 py-3 text-slate-300">{c.phone}</td>
                <td className="px-4 py-3">
                  <span className="text-white font-medium">{c.totalOrders}</span>
                  {c.totalOrders > 1 && <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Repeat</span>}
                </td>
                <td className="px-4 py-3 text-white">{c.totalSpent.toFixed(2)}</td>
                <td className="px-4 py-3 text-green-400">{c.totalCollected.toFixed(2)}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(c.lastVisit).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => router.push(`/dashboard/customers/${encodeURIComponent(c.phone)}`)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
