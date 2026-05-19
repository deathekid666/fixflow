"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

type SparePart = {
  id: string;
  name: string;
  partNumber: string;
  description: string;
  unitPrice: number;
  stock: number;
};

export default function SparePartsPage() {
  const { user } = useAuth();
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", partNumber: "", description: "", unitPrice: "", stock: "" });
  const [saving, setSaving] = useState(false);

  // Stock adjustment
  const [adjustingPart, setAdjustingPart] = useState<SparePart | null>(null);
  const [adjQuantity, setAdjQuantity] = useState("");
  const [adjType, setAdjType] = useState("ADD");
  const [adjReason, setAdjReason] = useState("");
  const [savingAdj, setSavingAdj] = useState(false);

  useEffect(() => { load(); }, [search]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/spareparts?${params}`);
    setParts(await res.json());
    setLoading(false);
  }

  async function handleCreate() {
    setSaving(true);
    const res = await fetch("/api/spareparts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, partNumber: form.partNumber,
        description: form.description,
        unitPrice: parseFloat(form.unitPrice),
        stock: parseInt(form.stock),
      }),
    });
    if (res.ok) {
      setForm({ name: "", partNumber: "", description: "", unitPrice: "", stock: "" });
      setShowForm(false);
      await load();
    }
    setSaving(false);
  }

  async function handleAdjust() {
    if (!adjustingPart || !adjQuantity) return;
    setSavingAdj(true);
    await fetch("/api/spareparts/adjustments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sparePartId: adjustingPart.id,
        quantity: parseInt(adjQuantity),
        type: adjType,
        reason: adjReason,
      }),
    });
    setAdjustingPart(null);
    setAdjQuantity("");
    setAdjType("ADD");
    setAdjReason("");
    await load();
    setSavingAdj(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Spare Parts</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your parts catalog and stock</p>
        </div>
        {user?.role === "ADMIN" && (
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors font-medium">
            + Add Part
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300">New Spare Part</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Name *", field: "name", placeholder: "e.g. Screen Assembly" },
              { label: "Part Number", field: "partNumber", placeholder: "e.g. SCR-AN10D" },
              { label: "Unit Price *", field: "unitPrice", placeholder: "0.00" },
              { label: "Stock Qty", field: "stock", placeholder: "0" },
            ].map(f => (
              <div key={f.field}>
                <label className="text-xs text-slate-400 mb-1 block">{f.label}</label>
                <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder={f.placeholder} value={(form as any)[f.field]}
                  onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))} />
              </div>
            ))}
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Description</label>
              <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                placeholder="Optional description" value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors">
              {saving ? "Saving..." : "Save Part"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stock adjustment modal */}
      {adjustingPart && (
        <div className="bg-slate-900 border border-blue-800/50 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300">Adjust Stock — {adjustingPart.name}</h2>
          <p className="text-xs text-slate-500">Current stock: <span className="text-white font-medium">{adjustingPart.stock}</span></p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Type</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                value={adjType} onChange={e => setAdjType(e.target.value)}>
                <option value="ADD">Add Stock</option>
                <option value="REMOVE">Remove Stock</option>
                <option value="CORRECTION">Set to exact qty</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Quantity</label>
              <input type="number" min="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                value={adjQuantity} onChange={e => setAdjQuantity(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Reason</label>
              <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                placeholder="Optional" value={adjReason} onChange={e => setAdjReason(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleAdjust} disabled={savingAdj || !adjQuantity}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors">
              {savingAdj ? "Saving..." : "Save Adjustment"}
            </button>
            <button onClick={() => setAdjustingPart(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <input className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        placeholder="Search parts..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              {["Name", "Part #", "Description", "Unit Price", "Stock", "Status", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>}
            {!loading && parts.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No parts found.</td></tr>}
            {parts.map(p => (
              <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.partNumber || "—"}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{p.description || "—"}</td>
                <td className="px-4 py-3 text-white">{p.unitPrice.toFixed(2)}</td>
                <td className="px-4 py-3 text-white font-medium">{p.stock}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    p.stock === 0 ? "bg-red-500/20 text-red-400" :
                    p.stock < 5 ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-green-500/20 text-green-400"
                  }`}>
                    {p.stock === 0 ? "Out of Stock" : p.stock < 5 ? "Low Stock" : "In Stock"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {user?.role === "ADMIN" && (
                    <button onClick={() => setAdjustingPart(p)}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      Adjust Stock
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
