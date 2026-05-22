"use client";
import { useEffect, useState, useCallback } from "react";

interface Shop { id: string; name: string; address: string | null; phone: string | null; createdAt: string; _count: { users: number; customers: number; workOrders: number }; }

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { const res = await fetch("/api/shops", { credentials: "include" }); const data = await res.json(); if (Array.isArray(data)) setShops(data); }
    catch { setError("Failed to load shops"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createShop() {
    if (!form.name.trim()) { setError("Shop name is required"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/shops", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      setForm({ name: "", address: "", phone: "" }); setShowForm(false); await load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); } finally { setSaving(false); }
  }

  async function deleteShop(id: string) {
    if (!confirm("Delete this shop?")) return;
    await fetch(`/api/shops/${id}`, { method: "DELETE", credentials: "include" });
    setShops((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-100">Shops</h1><p className="text-sm text-slate-400 mt-1">Manage branches</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">+ New Shop</button>
      </div>
      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-slate-300">New Shop</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Shop name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button onClick={createShop} disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">{saving ? "Saving..." : "Create Shop"}</button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition">Cancel</button>
          </div>
        </div>
      )}
      {loading ? <p className="text-slate-400 text-sm">Loading...</p> : shops.length === 0 ? <p className="text-slate-400 text-sm">No shops yet.</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shops.map((shop) => (
            <div key={shop.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div><h3 className="font-bold text-slate-100">{shop.name}</h3>{shop.address && <p className="text-sm text-slate-400">{shop.address}</p>}{shop.phone && <p className="text-sm text-slate-400">{shop.phone}</p>}</div>
                <button onClick={() => deleteShop(shop.id)} className="text-xs text-red-400 hover:text-red-300 transition">Delete</button>
              </div>
              <div className="flex gap-4 text-xs text-slate-400">
                <span>👤 {shop._count.users} users</span>
                <span>🔧 {shop._count.workOrders} orders</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}