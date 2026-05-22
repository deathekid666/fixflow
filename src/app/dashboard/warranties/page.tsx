"use client";
import { useEffect, useState, useCallback } from "react";

interface Warranty { id: string; durationDays: number; expiryDate: string; status: "ACTIVE" | "EXPIRED" | "VOID"; notes: string | null; inventoryItem: { id: string; name: string; sku: string | null }; }
interface SparePart { id: string; name: string; partNumber: string | null; }

const STATUS_STYLES = { ACTIVE: "bg-green-900/40 text-green-400", EXPIRED: "bg-red-900/40 text-red-400", VOID: "bg-slate-800 text-slate-500" };

export default function WarrantiesPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "EXPIRED">("ALL");
  const [form, setForm] = useState({ inventoryItemId: "", durationDays: "365", expiryDate: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [wRes, pRes] = await Promise.all([fetch("/api/warranties", { credentials: "include" }), fetch("/api/spareparts", { credentials: "include" })]);
      const [wData, pData] = await Promise.all([wRes.json(), pRes.json()]);
      setWarranties(Array.isArray(wData) ? wData : []); setParts(Array.isArray(pData) ? pData : []);
    } catch { setError("Failed to load"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createWarranty() {
    if (!form.inventoryItemId || !form.expiryDate) { setError("Part and expiry date required"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/warranties", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ inventoryItemId: form.inventoryItemId, durationDays: parseInt(form.durationDays), expiryDate: form.expiryDate, notes: form.notes || undefined }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      setForm({ inventoryItemId: "", durationDays: "365", expiryDate: "", notes: "" }); setShowForm(false); await load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); } finally { setSaving(false); }
  }

  async function voidWarranty(id: string) {
    await fetch(`/api/warranties/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ status: "VOID" }) });
    await load();
  }

  const filtered = warranties.filter((w) => filter === "ALL" || w.status === filter);
  const daysLeft = (expiry: string) => Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-100">Warranties</h1><p className="text-sm text-slate-400 mt-1">Track spare part warranties</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">+ Add Warranty</button>
      </div>
      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-slate-300">New Warranty</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs text-slate-400 mb-1 block">Spare Part *</label>
              <select value={form.inventoryItemId} onChange={(e) => setForm({ ...form, inventoryItemId: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                <option value="">Select a part...</option>
                {parts.map((p) => <option key={p.id} value={p.id}>{p.name} {p.partNumber ? `(${p.partNumber})` : ""}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-slate-400 mb-1 block">Duration (days)</label><input type="number" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" /></div>
            <div><label className="text-xs text-slate-400 mb-1 block">Expiry Date *</label><input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" /></div>
            <div><label className="text-xs text-slate-400 mb-1 block">Notes</label><input type="text" placeholder="Optional" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" /></div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button onClick={createWarranty} disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition">Cancel</button>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        {(["ALL", "ACTIVE", "EXPIRED"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${filter === f ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>{f}</button>
        ))}
      </div>
      {loading ? <p className="text-slate-400 text-sm">Loading...</p> : filtered.length === 0 ? <p className="text-slate-400 text-sm">No warranties found.</p> : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-xs text-slate-400 uppercase">
              <tr><th className="px-6 py-3 text-left">Part</th><th className="px-6 py-3 text-left">Expiry</th><th className="px-6 py-3 text-left">Remaining</th><th className="px-6 py-3 text-left">Status</th><th className="px-6 py-3 text-left">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((w) => {
                const days = daysLeft(w.expiryDate);
                return (
                  <tr key={w.id} className="hover:bg-slate-800/50 transition">
                    <td className="px-6 py-3 font-medium text-slate-200">{w.inventoryItem.name}</td>
                    <td className="px-6 py-3 text-slate-400">{new Date(w.expiryDate).toLocaleDateString()}</td>
                    <td className="px-6 py-3">{w.status === "ACTIVE" ? <span className={days <= 30 ? "text-orange-400 font-medium" : "text-slate-400"}>{days > 0 ? `${days} days` : "Today"}</span> : <span className="text-slate-600">—</span>}</td>
                    <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[w.status]}`}>{w.status}</span></td>
                    <td className="px-6 py-3">{w.status === "ACTIVE" && <button onClick={() => voidWarranty(w.id)} className="text-xs text-slate-400 hover:text-red-400 transition">Void</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}