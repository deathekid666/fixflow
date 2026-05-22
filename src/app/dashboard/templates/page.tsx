"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

type Template = {
  id: string;
  name: string;
  deviceBrand: string;
  deviceModel: string;
  faultDescription: string;
  repairType: string;
  faultLevel: string;
  serviceType: string;
  defaultPrice: number;
};

export default function TemplatesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", deviceBrand: "", deviceModel: "",
    faultDescription: "", repairType: "", faultLevel: "LOW",
    serviceType: "IN_STORE", defaultPrice: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/templates", { credentials: "include" });
    const data = await res.json();
    setTemplates(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleCreate() {
    if (!form.name || !form.faultDescription) { setError("Name and fault description required"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/templates", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ name: "", deviceBrand: "", deviceModel: "", faultDescription: "", repairType: "", faultLevel: "LOW", serviceType: "IN_STORE", defaultPrice: "" });
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

  const FAULT_COLORS: Record<string, string> = { LOW: "text-green-400", MEDIUM: "text-yellow-400", HIGH: "text-red-400" };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Work Order Templates</h1>
          <p className="text-sm text-slate-500 mt-0.5">Pre-fill common repairs to save time</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-medium transition-colors">
            + New Template
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300">New Template</h2>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Template Name *</label>
              <input placeholder="e.g. iPhone Screen Replacement" value={form.name} onChange={e => set("name", e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Device Brand</label>
              <input placeholder="e.g. Apple" value={form.deviceBrand} onChange={e => set("deviceBrand", e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Device Model</label>
              <input placeholder="e.g. iPhone 13" value={form.deviceModel} onChange={e => set("deviceModel", e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Fault Description *</label>
              <textarea rows={2} placeholder="e.g. Screen cracked, needs full replacement" value={form.faultDescription} onChange={e => set("faultDescription", e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Repair Type</label>
              <input placeholder="e.g. Screen Replacement" value={form.repairType} onChange={e => set("repairType", e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Default Price (MAD)</label>
              <input type="number" placeholder="0.00" value={form.defaultPrice} onChange={e => set("defaultPrice", e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Fault Level</label>
              <select value={form.faultLevel} onChange={e => set("faultLevel", e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Service Type</label>
              <select value={form.serviceType} onChange={e => set("serviceType", e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                <option value="IN_STORE">In Store</option>
                <option value="ON_SITE">On Site</option>
                <option value="RETRIEVAL">Retrieval</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={saving} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors">{saving ? "Saving..." : "Save Template"}</button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 border border-slate-700 text-slate-300 text-sm rounded-lg hover:bg-slate-800 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {loading ? <p className="text-slate-400 text-sm">Loading...</p> : templates.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-slate-400 text-sm">No templates yet.</p>
          {isAdmin && <p className="text-slate-600 text-xs mt-1">Create your first template to speed up work order creation.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{t.name}</h3>
                  {(t.deviceBrand || t.deviceModel) && (
                    <p className="text-xs text-slate-400 mt-0.5">{t.deviceBrand} {t.deviceModel}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {t.defaultPrice > 0 && <span className="text-xs text-emerald-400 font-medium">{t.defaultPrice} MAD</span>}
                  {isAdmin && (
                    <button onClick={() => handleDelete(t.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">Delete</button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">{t.faultDescription}</p>
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full bg-slate-800 ${FAULT_COLORS[t.faultLevel]}`}>{t.faultLevel}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{t.serviceType.replace("_", " ")}</span>
                {t.repairType && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{t.repairType}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}