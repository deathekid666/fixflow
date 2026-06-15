"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/currency";

type SparePart = {
  id: string; name: string; partNumber: string;
  description: string; unitPrice: number; stock: number;
};

type AlertPart = { id: string; name: string; partNumber: string; stock: number; unitPrice: number };
type AlertData = { outOfStock: AlertPart[]; lowStock: AlertPart[]; total: number };
type Supplier = { id: string; name: string };

const LOW_STOCK_THRESHOLD = 5;

export default function SparePartsPage() {
  const { user } = useAuth();
  const currency = user?.shop?.currency ?? "MAD";
  const fmt = (n: number) => formatCurrency(n, currency);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", partNumber: "", description: "", unitPrice: "", stock: "" });
  const [saving, setSaving] = useState(false);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjQuantity, setAdjQuantity] = useState("");
  const [adjType, setAdjType] = useState("ADD");
  const [adjReason, setAdjReason] = useState("");
  const [adjPrice, setAdjPrice] = useState("");
  const [savingAdj, setSavingAdj] = useState(false);
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [reorderSupplierId, setReorderSupplierId] = useState("");
  const [reorderQty, setReorderQty] = useState("10");
  const [reorderCost, setReorderCost] = useState("");
  const [reorderNotes, setReorderNotes] = useState("");
  const [submittingReorder, setSubmittingReorder] = useState(false);

  // Edit part details
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [editPartForm, setEditPartForm] = useState({ name: "", partNumber: "", description: "", unitPrice: "" });
  const [savingPart, setSavingPart] = useState(false);

  useEffect(() => {
    fetch("/api/spareparts/alert", { credentials: "include" })
      .then(r => r.json())
      .then((d: AlertData) => { if (d.total > 0) setAlertData(d); })
      .catch(() => {});
    fetch("/api/suppliers", { credentials: "include" })
      .then(r => r.json()).then(d => setSuppliers(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/spareparts?${params}`, { credentials: "include" });
    const data = await res.json();
    setParts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.name || !form.unitPrice) return;
    setSaving(true);
    const res = await fetch("/api/spareparts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: form.name, partNumber: form.partNumber,
        description: form.description,
        unitPrice: parseFloat(form.unitPrice),
        stock: parseInt(form.stock) || 0,
      }),
    });
    if (res.ok) {
      setForm({ name: "", partNumber: "", description: "", unitPrice: "", stock: "" });
      setShowForm(false);
      await load();
    }
    setSaving(false);
  }

  function openAdjust(p: SparePart) {
    setAdjustingId(p.id);
    setAdjQuantity("");
    setAdjType("ADD");
    setAdjReason("");
    setAdjPrice(p.unitPrice.toFixed(2));
  }

  async function handleAdjust(part: SparePart) {
    if (!adjQuantity && !adjPrice) return;
    setSavingAdj(true);

    if (adjPrice && parseFloat(adjPrice) !== part.unitPrice) {
      await fetch(`/api/spareparts/${part.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ unitPrice: parseFloat(adjPrice) }),
      });
    }

    if (adjQuantity) {
      await fetch("/api/spareparts/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sparePartId: part.id,
          quantity: parseInt(adjQuantity),
          type: adjType,
          reason: adjReason,
        }),
      });
    }

    setAdjustingId(null);
    setAdjQuantity(""); setAdjType("ADD"); setAdjReason(""); setAdjPrice("");
    await load();
    setSavingAdj(false);
  }

  function openEditPart(p: SparePart) {
    setEditingPartId(p.id);
    setEditPartForm({ name: p.name, partNumber: p.partNumber ?? "", description: p.description ?? "", unitPrice: p.unitPrice.toFixed(2) });
  }

  async function saveEditPart() {
    if (!editingPartId || !editPartForm.name.trim() || !editPartForm.unitPrice) return;
    setSavingPart(true);
    const res = await fetch(`/api/spareparts/${editingPartId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: editPartForm.name.trim(),
        partNumber: editPartForm.partNumber.trim() || null,
        description: editPartForm.description.trim() || null,
        unitPrice: parseFloat(editPartForm.unitPrice),
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setParts(prev => prev.map(p => p.id === editingPartId ? { ...p, ...updated } : p));
      setEditingPartId(null);
    }
    setSavingPart(false);
  }

  function openReorder(p: SparePart) {
    setReorderingId(p.id);
    setReorderQty("10");
    setReorderCost(p.unitPrice.toFixed(2));
    setReorderSupplierId("");
    setReorderNotes("");
  }

  async function submitReorder(p: SparePart) {
    if (!reorderSupplierId || !reorderQty || !reorderCost) return;
    setSubmittingReorder(true);
    await fetch("/api/purchase-orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        supplierId: reorderSupplierId,
        notes: reorderNotes || null,
        items: [{ sparePartId: p.id, quantity: parseInt(reorderQty), unitCost: parseFloat(reorderCost) }],
      }),
    });
    setReorderingId(null);
    setSubmittingReorder(false);
  }

  const outOfStock = parts.filter(p => p.stock === 0);
  const lowStock = parts.filter(p => p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD);
  const filtered = parts.filter(p => {
    if (stockFilter === "out") return p.stock === 0;
    if (stockFilter === "low") return p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD;
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Spare Parts</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your parts catalog and stock</p>
        </div>
        {user?.role === "ADMIN" && (
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors font-medium">
            + Add Part
          </button>
        )}
      </div>

      {/* Reorder Reminder */}
      {alertData && !alertDismissed && (
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-300 dark:border-orange-700/50 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔔</span>
              <div>
                <h2 className="text-sm font-semibold text-orange-700 dark:text-orange-300">Reorder Reminder</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {alertData.total} part{alertData.total !== 1 ? "s" : ""} need restocking
                </p>
              </div>
            </div>
            <button onClick={() => setAlertDismissed(true)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-400 text-sm leading-none mt-0.5 flex-shrink-0">✕</button>
          </div>

          <div className="mt-3 space-y-2">
            {alertData.outOfStock.length > 0 && (
              <div>
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold mb-1.5">Out of Stock ({alertData.outOfStock.length})</p>
                <div className="flex flex-wrap gap-2">
                  {alertData.outOfStock.map(p => (
                    <button key={p.id} onClick={() => setStockFilter("out")}
                      className="text-xs bg-red-500/15 border border-red-300 dark:border-red-700/40 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-lg hover:bg-red-500/25 transition-colors text-left">
                      <span className="font-medium">{p.name}</span>
                      {p.partNumber && <span className="opacity-60 ml-1">#{p.partNumber}</span>}
                      <span className="ml-1.5">· 0 left</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {alertData.lowStock.length > 0 && (
              <div>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold mb-1.5">Low Stock ({alertData.lowStock.length})</p>
                <div className="flex flex-wrap gap-2">
                  {alertData.lowStock.map(p => (
                    <button key={p.id} onClick={() => setStockFilter("low")}
                      className="text-xs bg-yellow-500/15 border border-yellow-300 dark:border-yellow-700/40 text-yellow-600 dark:text-yellow-400 px-2.5 py-1 rounded-lg hover:bg-yellow-500/25 transition-colors text-left">
                      <span className="font-medium">{p.name}</span>
                      {p.partNumber && <span className="opacity-60 ml-1">#{p.partNumber}</span>}
                      <span className="ml-1.5">· {p.stock} left</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add part form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">New Spare Part</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Name *", field: "name", placeholder: "e.g. Screen Assembly" },
              { label: "Part Number", field: "partNumber", placeholder: "e.g. SCR-AN10D" },
              { label: `Unit Price (${currency}) *`, field: "unitPrice", placeholder: "0.00" },
              { label: "Stock Qty", field: "stock", placeholder: "0" },
            ].map(f => (
              <div key={f.field}>
                <label className="text-xs text-slate-400 mb-1 block">{f.label}</label>
                <input className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder={f.placeholder} value={(form as any)[f.field]}
                  onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))} />
              </div>
            ))}
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Description</label>
              <input className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                placeholder="Optional description" value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg">
              {saving ? "Saving..." : "Save Part"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-3 flex-wrap">
        <input className="flex-1 min-w-[200px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          placeholder="Search parts..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex gap-2">
          {[
            { key: "all", label: `All (${parts.length})`, color: "" },
            { key: "low", label: `Low Stock (${lowStock.length})`, color: lowStock.length > 0 ? "text-yellow-600 dark:text-yellow-400" : "" },
            { key: "out", label: `Out of Stock (${outOfStock.length})`, color: outOfStock.length > 0 ? "text-red-600 dark:text-red-400" : "" },
          ].map(f => (
            <button key={f.key} onClick={() => setStockFilter(f.key as any)}
              className={`px-3 py-2 text-xs rounded-lg border font-medium transition-colors ${
                stockFilter === f.key ? "bg-blue-600 text-white border-blue-600" : `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 ${f.color || "text-slate-500 dark:text-slate-400"}`
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              {["Name", "Part #", "Unit Price", "Stock", "Status", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && [...Array(6)].map((_, i) => (
              <tr key={i} className="border-b border-slate-200/50 dark:border-slate-800/50 animate-pulse">
                <td className="px-4 py-3.5 space-y-1.5"><div className={`h-3 bg-slate-200 dark:bg-slate-700 rounded ${["w-28","w-36","w-24","w-32","w-28","w-30"][i]}`} /><div className="h-2 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                <td className="px-4 py-3.5"><div className={`h-3 bg-slate-200 dark:bg-slate-800 rounded font-mono ${["w-20","w-16","w-24","w-14","w-20","w-18"][i]}`} /></td>
                <td className="px-4 py-3.5"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                <td className="px-4 py-3.5"><div className="h-5 w-8 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                <td className="px-4 py-3.5"><div className="h-5 w-18 bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
                <td className="px-4 py-3.5"><div className="h-6 w-12 bg-slate-200 dark:bg-slate-800 rounded-lg" /></td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6}>
                <div className="py-16 flex flex-col items-center gap-3">
                  <span className="text-5xl">🔩</span>
                  <p className="text-slate-700 dark:text-slate-200 font-semibold text-base">
                    {search || stockFilter !== "all" ? "No parts match your filters" : "No spare parts yet"}
                  </p>
                  <p className="text-slate-400 text-sm text-center max-w-xs">
                    {search || stockFilter !== "all" ? "Try adjusting your search or filter." : "Add parts to track inventory, costs, and usage across work orders."}
                  </p>
                  {!search && stockFilter === "all" && user?.role === "ADMIN" && (
                    <button onClick={() => setShowForm(true)} className="mt-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
                      + Add First Part
                    </button>
                  )}
                </div>
              </td></tr>
            )}
            {filtered.map((p, i) => (
              <>
                <tr key={p.id} className={`fade-in border-b border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${p.stock === 0 ? "bg-red-50 dark:bg-red-950/10" : p.stock < LOW_STOCK_THRESHOLD ? "bg-yellow-50 dark:bg-yellow-950/10" : ""}`}
                  style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                    {p.name}
                    {p.stock === 0 && <span className="ml-2 text-xs bg-red-500/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">Out</span>}
                    {p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD && <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded">Low</span>}
                    {p.description && <p className="text-xs text-slate-500 font-normal mt-0.5">{p.description}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.partNumber || "—"}</td>
                  <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{fmt(p.unitPrice)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold text-base ${p.stock === 0 ? "text-red-600 dark:text-red-400" : p.stock < LOW_STOCK_THRESHOLD ? "text-yellow-600 dark:text-yellow-400" : "text-slate-900 dark:text-white"}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.stock === 0 ? "bg-red-500/20 text-red-600 dark:text-red-400" :
                      p.stock < LOW_STOCK_THRESHOLD ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" :
                      "bg-green-500/20 text-green-600 dark:text-green-400"
                    }`}>
                      {p.stock === 0 ? "Out of Stock" : p.stock < LOW_STOCK_THRESHOLD ? "Low Stock" : "In Stock"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user?.role === "ADMIN" && (
                        <>
                          <button onClick={() => editingPartId === p.id ? setEditingPartId(null) : openEditPart(p)}
                            className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${editingPartId === p.id ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300" : "bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300"}`}>
                            {editingPartId === p.id ? "✕ Close" : "✏ Edit"}
                          </button>
                          <button onClick={() => adjustingId === p.id ? setAdjustingId(null) : openAdjust(p)}
                            className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${adjustingId === p.id ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300" : "bg-blue-600/20 hover:bg-blue-600/40 text-blue-600 dark:text-blue-400"}`}>
                            {adjustingId === p.id ? "✕ Close" : "Adjust Stock"}
                          </button>
                        </>
                      )}
                      {(p.stock === 0 || p.stock < LOW_STOCK_THRESHOLD) && (
                        <button onClick={() => reorderingId === p.id ? setReorderingId(null) : openReorder(p)}
                          className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${reorderingId === p.id ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300" : "bg-orange-500/20 hover:bg-orange-500/40 text-orange-600 dark:text-orange-400"}`}>
                          {reorderingId === p.id ? "✕ Cancel" : "📦 Reorder"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Inline Edit row */}
                {editingPartId === p.id && (
                  <tr key={`edit-${p.id}`} className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <td colSpan={6} className="px-4 py-4">
                     <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                      <div className="space-y-3" style={{ minWidth: 600 }}>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Edit Part — {p.name}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="md:col-span-2">
                            <label className="text-xs text-slate-500 mb-1 block">Name *</label>
                            <input value={editPartForm.name} onChange={e => setEditPartForm(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Part Number</label>
                            <input value={editPartForm.partNumber} onChange={e => setEditPartForm(prev => ({ ...prev, partNumber: e.target.value }))}
                              placeholder="e.g. SCR-AN10D"
                              className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Unit Price ({currency}) *</label>
                            <input type="number" min="0" step="0.01" value={editPartForm.unitPrice} onChange={e => setEditPartForm(prev => ({ ...prev, unitPrice: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                          </div>
                          <div className="md:col-span-4">
                            <label className="text-xs text-slate-500 mb-1 block">Description</label>
                            <input value={editPartForm.description} onChange={e => setEditPartForm(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Optional description"
                              className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={saveEditPart} disabled={savingPart || !editPartForm.name.trim() || !editPartForm.unitPrice}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors">
                            {savingPart ? "Saving..." : "Save Changes"}
                          </button>
                          <button onClick={() => setEditingPartId(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg">Cancel</button>
                        </div>
                      </div>
                     </div>
                    </td>
                  </tr>
                )}

                {/* Inline Reorder row */}
                {reorderingId === p.id && (
                  <tr key={`reorder-${p.id}`} className="border-b border-orange-200 dark:border-orange-800/30 bg-orange-50 dark:bg-orange-950/10">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">Quick Reorder — {p.name}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Supplier *</label>
                            <select
                              className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                              value={reorderSupplierId} onChange={e => setReorderSupplierId(e.target.value)}>
                              <option value="">Select supplier...</option>
                              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            {suppliers.length === 0 && (
                              <p className="text-xs text-slate-400 mt-1">No suppliers — <a href="/dashboard/suppliers" className="text-blue-500 underline">add one first</a></p>
                            )}
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Quantity</label>
                            <input type="number" min="1"
                              className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                              value={reorderQty} onChange={e => setReorderQty(e.target.value)} />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Unit Cost ({currency})</label>
                            <input type="number" min="0" step="0.01"
                              className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                              value={reorderCost} onChange={e => setReorderCost(e.target.value)} />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Notes</label>
                            <input
                              className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                              placeholder="Optional" value={reorderNotes} onChange={e => setReorderNotes(e.target.value)} />
                          </div>
                        </div>
                        {reorderQty && reorderCost && (
                          <p className="text-xs text-slate-500">
                            Total: <strong className="text-slate-900 dark:text-white">{fmt(parseInt(reorderQty || "0") * parseFloat(reorderCost || "0"))}</strong>
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button onClick={() => submitReorder(p)} disabled={submittingReorder || !reorderSupplierId || !reorderQty || !reorderCost}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors">
                            {submittingReorder ? "Creating..." : "Create Draft Purchase Order"}
                          </button>
                          <button onClick={() => setReorderingId(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Inline edit/adjust row */}
                {adjustingId === p.id && (
                  <tr key={`adj-${p.id}`} className="border-b border-blue-300 dark:border-blue-800/30 bg-blue-50 dark:bg-slate-800/50">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="space-y-3">
                        <p className="text-xs text-slate-500 font-medium">Edit part — changes save immediately</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Unit Price ({currency})</label>
                            <input type="number" min="0" step="0.01"
                              className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                              value={adjPrice} onChange={e => setAdjPrice(e.target.value)} />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Stock Adjustment</label>
                            <select className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
                              value={adjType} onChange={e => setAdjType(e.target.value)}>
                              <option value="ADD">+ Add Stock</option>
                              <option value="REMOVE">− Remove Stock</option>
                              <option value="CORRECTION">= Set Exact</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Quantity</label>
                            <input type="number" min="0"
                              className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                              placeholder="0" value={adjQuantity} onChange={e => setAdjQuantity(e.target.value)} />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Reason</label>
                            <input className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                              placeholder="Optional" value={adjReason} onChange={e => setAdjReason(e.target.value)} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleAdjust(p)} disabled={savingAdj || (!adjQuantity && !adjPrice)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors">
                            {savingAdj ? "Saving..." : "Save Changes"}
                          </button>
                          <button onClick={() => setAdjustingId(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
