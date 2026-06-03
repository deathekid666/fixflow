"use client";

import { useEffect, useState } from "react";

type Shop = {
  id: string;
  name: string;
  phone: string | null;
  status: string;
  plan: string;
  trialEndsAt: string | null;
  createdAt: string;
  _count: { workOrders: number; users: number };
  users: { name: string; email: string }[];
};

const STATUS_COLORS: Record<string, string> = {
  TRIAL: "bg-yellow-500/20 text-yellow-400",
  ACTIVE: "bg-green-500/20 text-green-400",
  SUSPENDED: "bg-red-500/20 text-red-400",
};

export default function SuperAdminPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/admin/shops", { credentials: "include" });
    if (res.ok) setShops(await res.json());
    setLoading(false);
  }

  async function updateShop(shopId: string, data: { status?: string; plan?: string }) {
    setUpdating(shopId);
    await fetch("/api/admin/shops", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ shopId, ...data }),
    });
    await load();
    setUpdating(null);
  }

  const totalOrders = shops.reduce((s, sh) => s + sh._count.workOrders, 0);
  const trialShops = shops.filter(s => s.status === "TRIAL").length;
  const activeShops = shops.filter(s => s.status === "ACTIVE").length;

  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-white">FixFlow</span>
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-medium">Super Admin</span>
          </div>
          <p className="text-slate-500 text-sm mt-1">Manage all shops and subscriptions</p>
        </div>
        <a href="/dashboard" className="text-xs text-slate-400 hover:text-white transition-colors">← My Dashboard</a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Shops", value: shops.length, color: "text-white", icon: "🏪" },
          { label: "Trial", value: trialShops, color: "text-yellow-400", icon: "⏳" },
          { label: "Active", value: activeShops, color: "text-green-400", icon: "✅" },
          { label: "Total Orders", value: totalOrders, color: "text-blue-400", icon: "📋" },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">{s.label}</p>
              <span className="text-lg">{s.icon}</span>
            </div>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Shops table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white">All Shops</h2>
        </div>
        {loading ? (
          <p className="text-slate-500 text-sm p-5">Loading...</p>
        ) : shops.length === 0 ? (
          <p className="text-slate-500 text-sm p-5">No shops yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {["Shop", "Owner", "Orders", "Users", "Status", "Plan", "Trial Ends", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shops.map(shop => (
                <tr key={shop.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{shop.name}</p>
                    {shop.phone && <p className="text-xs text-slate-500">{shop.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {shop.users[0] ? (
                      <div>
                        <p className="text-slate-300 text-xs">{shop.users[0].name}</p>
                        <p className="text-slate-500 text-xs">{shop.users[0].email}</p>
                      </div>
                    ) : <span className="text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{shop._count.workOrders}</td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{shop._count.users}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[shop.status] ?? "bg-slate-700 text-slate-400"}`}>
                      {shop.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select value={shop.plan}
                      onChange={e => updateShop(shop.id, { plan: e.target.value })}
                      disabled={updating === shop.id}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none">
                      <option value="FREE">FREE</option>
                      <option value="PRO">PRO</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {shop.trialEndsAt ? new Date(shop.trialEndsAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {shop.status !== "ACTIVE" && (
                        <button onClick={() => updateShop(shop.id, { status: "ACTIVE" })}
                          disabled={updating === shop.id}
                          className="text-xs px-2 py-1 bg-green-600/30 hover:bg-green-600/50 text-green-400 rounded transition-colors">
                          Activate
                        </button>
                      )}
                      {shop.status !== "SUSPENDED" && (
                        <button onClick={() => updateShop(shop.id, { status: "SUSPENDED" })}
                          disabled={updating === shop.id}
                          className="text-xs px-2 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-400 rounded transition-colors">
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}