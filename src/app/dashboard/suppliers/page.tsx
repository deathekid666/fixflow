"use client";

import { useEffect, useState } from "react";

type Supplier = {
  id: string; name: string; phone: string | null; email: string | null;
  address: string | null; notes: string | null; createdAt: string;
  _count: { purchaseOrders: number };
};

type SparePart = { id: string; name: string; partNumber: string; stock: number; unitPrice: number };

type POItem = { sparePartId: string; quantity: string; unitCost: string };

type PurchaseOrder = {
  id: string; status: string; totalAmount: number; notes: string | null; createdAt: string;
  supplier: { id: string; name: string };
  items: { id: string; quantity: number; unitCost: number; totalCost: number; sparePart: { name: string; partNumber: string } }[];
  creator: { name: string };
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
  SENT: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  RECEIVED: "bg-green-500/20 text-green-600 dark:text-green-400",
};

const INPUT = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"suppliers" | "orders">("suppliers");
  const [filterSupplier, setFilterSupplier] = useState("");

  // Add supplier form
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const [saving, setSaving] = useState(false);

  // Create PO
  const [creatingPO, setCreatingPO] = useState<string | null>(null);
  const [poItems, setPOItems] = useState<POItem[]>([{ sparePartId: "", quantity: "1", unitCost: "" }]);
  const [poNotes, setPONotes] = useState("");
  const [submittingPO, setSubmittingPO] = useState(false);

  // Update PO status
  const [updatingPO, setUpdatingPO] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
    fetch("/api/spareparts", { credentials: "include" })
      .then(r => r.json()).then(d => setParts(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  async function loadAll() {
    setLoading(true);
    const [s, o] = await Promise.all([
      fetch("/api/suppliers", { credentials: "include" }).then(r => r.json()),
      fetch("/api/purchase-orders", { credentials: "include" }).then(r => r.json()),
    ]);
    setSuppliers(Array.isArray(s) ? s : []);
    setOrders(Array.isArray(o) ? o : []);
    setLoading(false);
  }

  async function addSupplier() {
    if (!form.name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/suppliers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify(form),
    });
    if (res.ok) {
      const s = await res.json();
      setSuppliers(prev => [...prev, s].sort((a, b) => a.name.localeCompare(b.name)));
      setForm({ name: "", phone: "", email: "", address: "", notes: "" });
      setShowAdd(false);
    }
    setSaving(false);
  }

  async function deleteSupplier(id: string) {
    if (!confirm("Delete this supplier? This cannot be undone.")) return;
    await fetch("/api/suppliers", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ id }),
    });
    setSuppliers(prev => prev.filter(s => s.id !== id));
  }

  function openCreatePO(supplierId: string) {
    setCreatingPO(supplierId);
    setPOItems([{ sparePartId: "", quantity: "1", unitCost: "" }]);
    setPONotes("");
  }

  function addPOItem() {
    setPOItems(prev => [...prev, { sparePartId: "", quantity: "1", unitCost: "" }]);
  }

  function removePOItem(i: number) {
    setPOItems(prev => prev.filter((_, idx) => idx !== i));
  }

  function updatePOItem(i: number, field: keyof POItem, value: string) {
    setPOItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item;
      if (field === "sparePartId") {
        const part = parts.find(p => p.id === value);
        return { ...item, sparePartId: value, unitCost: part ? part.unitPrice.toFixed(2) : item.unitCost };
      }
      return { ...item, [field]: value };
    }));
  }

  async function submitPO() {
    if (!creatingPO) return;
    const validItems = poItems.filter(i => i.sparePartId && i.quantity && i.unitCost);
    if (validItems.length === 0) return;
    setSubmittingPO(true);
    const res = await fetch("/api/purchase-orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        supplierId: creatingPO,
        notes: poNotes || null,
        items: validItems.map(i => ({
          sparePartId: i.sparePartId,
          quantity: parseInt(i.quantity),
          unitCost: parseFloat(i.unitCost),
        })),
      }),
    });
    if (res.ok) {
      const order = await res.json();
      setOrders(prev => [order, ...prev]);
      setSuppliers(prev => prev.map(s => s.id === creatingPO ? { ...s, _count: { purchaseOrders: s._count.purchaseOrders + 1 } } : s));
      setCreatingPO(null);
      setTab("orders");
    }
    setSubmittingPO(false);
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingPO(id);
    const res = await fetch(`/api/purchase-orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    }
    setUpdatingPO(null);
  }

  const poTotal = poItems.reduce((sum, i) => {
    const qty = parseInt(i.quantity) || 0;
    const cost = parseFloat(i.unitCost) || 0;
    return sum + qty * cost;
  }, 0);

  const filteredOrders = filterSupplier ? orders.filter(o => o.supplier.id === filterSupplier) : orders;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Suppliers</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage suppliers and purchase orders</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-medium transition-colors">
          + Add Supplier
        </button>
      </div>

      {/* Add Supplier Form */}
      {showAdd && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">New Supplier</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Name *</label>
              <input className={INPUT} placeholder="e.g. TechParts Morocco" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Phone</label>
              <input className={INPUT} placeholder="+212 6XX XXX XXX" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Email</label>
              <input className={INPUT} placeholder="supplier@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Address</label>
              <input className={INPUT} placeholder="City, Country" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">Notes</label>
              <input className={INPUT} placeholder="Payment terms, lead time, etc." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addSupplier} disabled={saving || !form.name.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg">{saving ? "Saving..." : "Save Supplier"}</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {(["suppliers", "orders"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px capitalize ${tab === t ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            {t === "suppliers" ? `Suppliers (${suppliers.length})` : `Purchase Orders (${orders.length})`}
          </button>
        ))}
      </div>

      {/* Suppliers Tab */}
      {tab === "suppliers" && (
        <div className="space-y-4">
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1, 2].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
            </div>
          )}

          {!loading && suppliers.length === 0 && (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <span className="text-5xl">🏭</span>
              <p className="text-slate-700 dark:text-slate-200 font-semibold">No suppliers yet</p>
              <p className="text-slate-400 text-sm">Add your first supplier to start creating purchase orders.</p>
              <button onClick={() => setShowAdd(true)} className="mt-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg">
                + Add Supplier
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.map(s => (
              <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-lg flex-shrink-0">🏭</div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{s.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{s._count.purchaseOrders} purchase order{s._count.purchaseOrders !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteSupplier(s.id)} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 text-sm transition-colors flex-shrink-0">🗑</button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {s.phone && <div className="flex items-center gap-1.5 text-slate-500"><span>📞</span>{s.phone}</div>}
                  {s.email && <div className="flex items-center gap-1.5 text-slate-500 truncate"><span>✉️</span><span className="truncate">{s.email}</span></div>}
                  {s.address && <div className="flex items-center gap-1.5 text-slate-500 col-span-2"><span>📍</span>{s.address}</div>}
                  {s.notes && <div className="col-span-2 text-slate-400 italic">{s.notes}</div>}
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={() => creatingPO === s.id ? setCreatingPO(null) : openCreatePO(s.id)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${creatingPO === s.id ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300" : "bg-blue-600 hover:bg-blue-500 text-white"}`}>
                    {creatingPO === s.id ? "✕ Cancel PO" : "📦 New Purchase Order"}
                  </button>
                  <button onClick={() => { setFilterSupplier(s.id); setTab("orders"); }}
                    className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">
                    View Orders
                  </button>
                </div>

                {/* Inline Create PO Form */}
                {creatingPO === s.id && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">New Purchase Order — {s.name}</p>

                    {poItems.map((item, i) => {
                      const selectedPart = parts.find(p => p.id === item.sparePartId);
                      return (
                        <div key={i} className="flex gap-2 items-start">
                          <div className="flex-1 min-w-0">
                            <select
                              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                              value={item.sparePartId}
                              onChange={e => updatePOItem(i, "sparePartId", e.target.value)}>
                              <option value="">Select part...</option>
                              {parts.map(p => (
                                <option key={p.id} value={p.id}>{p.name}{p.partNumber ? ` (${p.partNumber})` : ""} — Stock: {p.stock}</option>
                              ))}
                            </select>
                          </div>
                          <input type="number" min="1" placeholder="Qty"
                            className="w-16 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                            value={item.quantity} onChange={e => updatePOItem(i, "quantity", e.target.value)} />
                          <input type="number" min="0" step="0.01" placeholder="Cost"
                            className="w-20 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                            value={item.unitCost} onChange={e => updatePOItem(i, "unitCost", e.target.value)} />
                          {poItems.length > 1 && (
                            <button onClick={() => removePOItem(i)} className="text-red-400 hover:text-red-500 text-xs pt-1.5 flex-shrink-0">✕</button>
                          )}
                        </div>
                      );
                    })}

                    <button onClick={addPOItem} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors">
                      + Add another part
                    </button>

                    <input className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      placeholder="Notes (optional)" value={poNotes} onChange={e => setPONotes(e.target.value)} />

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Total: <strong className="text-slate-900 dark:text-white">{poTotal.toFixed(2)} MAD</strong></span>
                      <button onClick={submitPO} disabled={submittingPO || poItems.every(i => !i.sparePartId)}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg font-medium transition-colors">
                        {submittingPO ? "Creating..." : "Create Draft PO"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchase Orders Tab */}
      {tab === "orders" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)}>
              <option value="">All Suppliers</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <span className="text-xs text-slate-400">{filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}</span>
          </div>

          {filteredOrders.length === 0 && !loading && (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <span className="text-5xl">📦</span>
              <p className="text-slate-700 dark:text-slate-200 font-semibold">No purchase orders</p>
              <p className="text-slate-400 text-sm">Create a purchase order from the Suppliers tab.</p>
            </div>
          )}

          <div className="space-y-3">
            {filteredOrders.map(o => (
              <div key={o.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{o.supplier.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[o.status] ?? STATUS_STYLES.DRAFT}`}>
                        {o.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(o.createdAt).toLocaleDateString()} · by {o.creator.name} · {o.items.length} item{o.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{o.totalAmount.toFixed(2)} MAD</span>
                    {o.status === "DRAFT" && (
                      <button onClick={() => updateStatus(o.id, "SENT")} disabled={updatingPO === o.id}
                        className="text-xs px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-600 dark:text-blue-400 rounded-lg transition-colors disabled:opacity-50">
                        Mark Sent
                      </button>
                    )}
                    {o.status === "SENT" && (
                      <button onClick={() => updateStatus(o.id, "RECEIVED")} disabled={updatingPO === o.id}
                        className="text-xs px-3 py-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-600 dark:text-green-400 rounded-lg transition-colors disabled:opacity-50">
                        Mark Received
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-400">
                        <th className="text-left pb-1.5 font-medium">Part</th>
                        <th className="text-right pb-1.5 font-medium">Qty</th>
                        <th className="text-right pb-1.5 font-medium">Unit Cost</th>
                        <th className="text-right pb-1.5 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700 dark:text-slate-300">
                      {o.items.map(item => (
                        <tr key={item.id}>
                          <td className="py-0.5">
                            {item.sparePart.name}
                            {item.sparePart.partNumber && <span className="text-slate-400 ml-1">#{item.sparePart.partNumber}</span>}
                          </td>
                          <td className="text-right py-0.5">{item.quantity}</td>
                          <td className="text-right py-0.5">{item.unitCost.toFixed(2)}</td>
                          <td className="text-right py-0.5 font-medium">{item.totalCost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {o.notes && <p className="text-xs text-slate-400 italic">Note: {o.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
