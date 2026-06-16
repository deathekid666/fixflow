"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/currency";

type SparePart = { id: string; name: string; partNumber: string | null; unitPrice: number };
type DefaultPart = { sparePartId: string; quantity: number };
type DefaultLineItem = { label: string; amount: number };

type Template = {
  id: string;
  name: string;
  category: string;
  deviceBrand: string;
  deviceModel: string;
  faultDescription: string;
  repairType: string;
  faultLevel: string;
  serviceType: string;
  defaultPrice: number;
  estimatedDuration: number;
  defaultParts: DefaultPart[];
  defaultLineItems: DefaultLineItem[];
};

const FAULT_COLORS: Record<string, string> = {
  LOW: "text-green-600 dark:text-green-400 bg-green-500/10",
  MEDIUM: "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10",
  HIGH: "text-red-600 dark:text-red-400 bg-red-500/10",
};

const CATEGORIES = ["", "Apple", "Samsung", "Huawei", "Honor", "Xiaomi", "Other"];

export default function TemplatesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const currency = user?.shop?.currency ?? "MAD";
  const [templates, setTemplates] = useState<Template[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const [form, setForm] = useState({
    name: "", category: "", deviceBrand: "", deviceModel: "",
    faultDescription: "", repairType: "", faultLevel: "LOW",
    serviceType: "IN_STORE", defaultPrice: "", estimatedDuration: "",
  });
  const [defaultParts, setDefaultParts] = useState<DefaultPart[]>([]);
  const [defaultLineItems, setDefaultLineItems] = useState<DefaultLineItem[]>([]);
  const [newPartId, setNewPartId] = useState("");
  const [newPartQty, setNewPartQty] = useState("1");
  const [newLineLabel, setNewLineLabel] = useState("");
  const [newLineAmount, setNewLineAmount] = useState("");

  const load = useCallback(async () => {
    const [tRes, pRes] = await Promise.all([
      fetch("/api/templates", { credentials: "include" }),
      fetch("/api/spareparts", { credentials: "include" }),
    ]);
    const [tData, pData] = await Promise.all([tRes.json(), pRes.json()]);
    setTemplates(Array.isArray(tData) ? tData : []);
    setSpareParts(Array.isArray(pData) ? pData : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function addDefaultPart() {
    if (!newPartId) return;
    const exists = defaultParts.find(p => p.sparePartId === newPartId);
    if (exists) return;
    setDefaultParts(prev => [...prev, { sparePartId: newPartId, quantity: parseInt(newPartQty) || 1 }]);
    setNewPartId(""); setNewPartQty("1");
  }

  function removeDefaultPart(id: string) {
    setDefaultParts(prev => prev.filter(p => p.sparePartId !== id));
  }

  function addDefaultLineItem() {
    if (!newLineLabel || !newLineAmount) return;
    setDefaultLineItems(prev => [...prev, { label: newLineLabel, amount: parseFloat(newLineAmount) }]);
    setNewLineLabel(""); setNewLineAmount("");
  }

  function removeDefaultLineItem(i: number) {
    setDefaultLineItems(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleCreate() {
    if (!form.name || !form.faultDescription) { setError("Name and fault description required"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/templates", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...form, defaultParts, defaultLineItems }),
    });
    if (res.ok) {
      setForm({ name: "", category: "", deviceBrand: "", deviceModel: "", faultDescription: "", repairType: "", faultLevel: "LOW", serviceType: "IN_STORE", defaultPrice: "", estimatedDuration: "" });
      setDefaultParts([]); setDefaultLineItems([]);
      setShowForm(false); await load();
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;
    await fetch("/api/templates", { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id }) });
    await load();
  }

  const categories = [...new Set(templates.map(t => t.category).filter(Boolean))];
  const filtered = filterCategory ? templates.filter(t => t.category === filterCategory) : templates;

  function formatDuration(mins: number) {
    if (!mins) return null;
    if (mins < 60) return `${mins}min`;
    return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}min` : ""}`;
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Work Order Templates</h1>
          <p className="text-sm text-slate-500 mt-0.5">Pre-fill common repairs to save time</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-medium transition-colors">
            + New Template
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">New Template</h2>
          {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Template Name *</label>
              <input placeholder="e.g. iPhone 13 Screen Replacement" value={form.name} onChange={e => set("name", e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Category</label>
              <select value={form.category} onChange={e => set("category", e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c || "No category"}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Estimated Duration</label>
              <div className="flex gap-2 items-center">
                <input type="number" placeholder="e.g. 60" value={form.estimatedDuration} onChange={e => set("estimatedDuration", e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                <span className="text-xs text-slate-500">minutes</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Device Brand</label>
              <input placeholder="e.g. Apple" value={form.deviceBrand} onChange={e => set("deviceBrand", e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Device Model</label>
              <input placeholder="e.g. iPhone 13" value={form.deviceModel} onChange={e => set("deviceModel", e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Fault Description *</label>
              <textarea rows={2} placeholder="e.g. Screen cracked, needs full replacement" value={form.faultDescription} onChange={e => set("faultDescription", e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Repair Type</label>
              <input placeholder="e.g. Screen Replacement" value={form.repairType} onChange={e => set("repairType", e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Default Price ({currency})</label>
              <input type="number" placeholder="0.00" value={form.defaultPrice} onChange={e => set("defaultPrice", e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Fault Level</label>
              <select value={form.faultLevel} onChange={e => set("faultLevel", e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Service Type</label>
              <select value={form.serviceType} onChange={e => set("serviceType", e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none">
                <option value="IN_STORE">In Store</option>
                <option value="ON_SITE">On Site</option>
                <option value="RETRIEVAL">Retrieval</option>
              </select>
            </div>
          </div>

          {/* Default spare parts */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-medium block">Default Spare Parts</label>
            <div className="flex gap-2">
              <select value={newPartId} onChange={e => setNewPartId(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                <option value="">Select part...</option>
                {spareParts.map(p => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.unitPrice, currency)}</option>)}
              </select>
              <input type="number" min="1" value={newPartQty} onChange={e => setNewPartQty(e.target.value)}
                className="w-16 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none" placeholder="Qty" />
              <button onClick={addDefaultPart} disabled={!newPartId}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg">Add</button>
            </div>
            {defaultParts.length > 0 && (
              <div className="space-y-1">
                {defaultParts.map(dp => {
                  const part = spareParts.find(p => p.id === dp.sparePartId);
                  return (
                    <div key={dp.sparePartId} className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 text-xs">
                      <span className="text-slate-600 dark:text-slate-300">{part?.name} × {dp.quantity}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">{formatCurrency((part?.unitPrice ?? 0) * dp.quantity, currency)}</span>
                        <button onClick={() => removeDefaultPart(dp.sparePartId)} className="text-red-500 dark:text-red-400 hover:text-red-400 dark:hover:text-red-300">×</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Default line items */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-medium block">Default Line Items (Labor, Services)</label>
            <div className="flex gap-2">
              <input placeholder="e.g. Labor fee" value={newLineLabel} onChange={e => setNewLineLabel(e.target.value)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none" />
              <input type="number" placeholder="Amount" value={newLineAmount} onChange={e => setNewLineAmount(e.target.value)}
                className="w-24 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none" />
              <button onClick={addDefaultLineItem} disabled={!newLineLabel || !newLineAmount}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg">Add</button>
            </div>
            {defaultLineItems.length > 0 && (
              <div className="space-y-1">
                {defaultLineItems.map((li, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 text-xs">
                    <span className="text-slate-600 dark:text-slate-300">{li.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">{formatCurrency(li.amount, currency)}</span>
                      <button onClick={() => removeDefaultLineItem(i)} className="text-red-500 dark:text-red-400 hover:text-red-400 dark:hover:text-red-300">×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={saving} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors">{saving ? "Saving..." : "Save Template"}</button>
            <button onClick={() => { setShowForm(false); setDefaultParts([]); setDefaultLineItems([]); }} className="px-5 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCategory("")} className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${!filterCategory ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600"}`}>All</button>
          {categories.map(c => (
            <button key={c} onClick={() => setFilterCategory(c)} className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${filterCategory === c ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600"}`}>{c}</button>
          ))}
        </div>
      )}

      {/* Templates grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
              <div className="flex gap-2 pt-1">
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-16" />
                <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-full w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center gap-3">
          <span className="text-5xl">🗂️</span>
          <p className="text-slate-700 dark:text-slate-200 font-semibold text-base">
            {filterCategory ? `No templates in "${filterCategory}"` : "No templates yet"}
          </p>
          <p className="text-slate-400 text-sm text-center max-w-xs">
            {filterCategory ? "Try a different category or clear the filter." : "Templates let you pre-fill common repairs — brand, fault, parts, and pricing in one click."}
          </p>
          {!filterCategory && isAdmin && (
            <button onClick={() => setShowForm(true)} className="mt-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
              + Create First Template
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(t => (
            <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{t.name}</h3>
                    {t.category && <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">{t.category}</span>}
                  </div>
                  {(t.deviceBrand || t.deviceModel) && <p className="text-xs text-slate-400 mt-0.5">{t.deviceBrand} {t.deviceModel}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {t.defaultPrice > 0 && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{formatCurrency(t.defaultPrice, currency)}</span>}
                  {isAdmin && <button onClick={() => handleDelete(t.id)} className="text-xs text-red-500 dark:text-red-400 hover:text-red-400 dark:hover:text-red-300">Delete</button>}
                </div>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2">{t.faultDescription}</p>

              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FAULT_COLORS[t.faultLevel]}`}>{t.faultLevel}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{t.serviceType.replace("_", " ")}</span>
                {t.repairType && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{t.repairType}</span>}
                {t.estimatedDuration > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400">⏱ {formatDuration(t.estimatedDuration)}</span>}
              </div>

              {/* Default parts preview */}
              {Array.isArray(t.defaultParts) && t.defaultParts.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">🔧 Default Parts ({t.defaultParts.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {(t.defaultParts as DefaultPart[]).map((dp, i) => {
                      const part = spareParts.find(p => p.id === dp.sparePartId);
                      return part ? (
                        <span key={i} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded">{part.name} ×{dp.quantity}</span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Default line items preview */}
              {Array.isArray(t.defaultLineItems) && t.defaultLineItems.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">💰 Default Services ({t.defaultLineItems.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {(t.defaultLineItems as DefaultLineItem[]).map((li, i) => (
                      <span key={i} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded">{li.label}: {formatCurrency(li.amount, currency)}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}