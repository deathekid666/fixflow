"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/currency";
import { useLanguage } from "@/context/LanguageContext";

type Contract = {
  id: string;
  customerPhone: string;
  customerName: string;
  deviceBrand: string;
  deviceModel: string;
  description: string | null;
  monthlyPrice: number;
  startDate: string;
  endDate: string | null;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  nextBillingDate: string;
  notes: string | null;
  createdAt: string;
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:    "bg-green-500/15 text-green-700 dark:text-green-400",
  PAUSED:    "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  CANCELLED: "bg-slate-400/15 text-slate-500 dark:text-slate-400",
};

const INPUT = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500";

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

function nextBillingLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return { label: "Overdue", cls: "text-red-500 font-semibold" };
  if (diff === 0) return { label: "Today", cls: "text-orange-500 font-semibold" };
  if (diff <= 3) return { label: `In ${diff}d`, cls: "text-orange-400 font-medium" };
  return { label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), cls: "text-slate-500 dark:text-slate-400" };
}

export default function ContractsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const currency = user?.shop?.currency ?? "MAD";
  const fmt = (n: number) => formatCurrency(n, currency);

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "PAUSED" | "CANCELLED">("ALL");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [billedCount, setBilledCount] = useState<number | null>(null);

  const [form, setForm] = useState({
    customerName: "", customerPhone: "", deviceBrand: "", deviceModel: "",
    description: "", monthlyPrice: "", startDate: new Date().toISOString().slice(0, 10),
    endDate: "", notes: "",
  });

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<{ status: string; monthlyPrice: string; endDate: string; notes: string; description: string }>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/contracts", { credentials: "include" });
    if (res.ok) setContracts(await res.json());
    setLoading(false);
  }, []);

  // On mount: load contracts, then trigger billing check
  useEffect(() => {
    load().then(async () => {
      const res = await fetch("/api/contracts/bill", { method: "POST", credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.billed > 0) {
          setBilledCount(data.billed);
          load(); // reload to see updated nextBillingDate
        }
      }
    });
  }, [load]);

  const filtered = filter === "ALL" ? contracts : contracts.filter(c => c.status === filter);

  const activeContracts = contracts.filter(c => c.status === "ACTIVE");
  const monthlyRevenue = activeContracts.reduce((sum, c) => sum + c.monthlyPrice, 0);
  const dueCount = activeContracts.filter(c => new Date(c.nextBillingDate) <= new Date()).length;

  async function createContract() {
    if (!form.customerName || !form.customerPhone || !form.deviceBrand || !form.deviceModel || !form.startDate) return;
    setSaving(true);
    const res = await fetch("/api/contracts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify(form),
    });
    if (res.ok) {
      const c = await res.json();
      setContracts(prev => [c, ...prev]);
      setShowForm(false);
      setForm({ customerName: "", customerPhone: "", deviceBrand: "", deviceModel: "", description: "", monthlyPrice: "", startDate: new Date().toISOString().slice(0, 10), endDate: "", notes: "" });
    }
    setSaving(false);
  }

  function openEdit(c: Contract) {
    setEditId(c.id);
    setEditForm({ status: c.status, monthlyPrice: String(c.monthlyPrice), endDate: c.endDate ? toDateInput(c.endDate) : "", notes: c.notes ?? "", description: c.description ?? "" });
  }

  async function saveEdit(id: string) {
    setSavingEdit(true);
    const body: Record<string, unknown> = { ...editForm };
    if (editForm.monthlyPrice) body.monthlyPrice = parseFloat(editForm.monthlyPrice);
    const res = await fetch(`/api/contracts/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setContracts(prev => prev.map(c => c.id === id ? updated : c));
      setEditId(null);
    }
    setSavingEdit(false);
  }

  async function quickStatus(id: string, status: string) {
    const res = await fetch(`/api/contracts/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setContracts(prev => prev.map(c => c.id === id ? updated : c));
    }
  }

  async function deleteContract(id: string) {
    if (!confirm("Delete this contract? This cannot be undone.")) return;
    const res = await fetch(`/api/contracts/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) setContracts(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t("maintenanceContracts")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t("contractsSubtitle")}</p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setEditId(null); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
          {showForm ? "✕ " + t("cancelAction") : "+ " + t("newContract")}
        </button>
      </div>

      {/* Billed banner */}
      {billedCount !== null && billedCount > 0 && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-lg">📄</span>
          <p className="text-sm text-green-700 dark:text-green-400 font-medium">
            {billedCount} contract{billedCount !== 1 ? "s" : ""} billed — work order{billedCount !== 1 ? "s" : ""} created automatically.
          </p>
          <button onClick={() => setBilledCount(null)} className="ml-auto text-green-600 dark:text-green-400 text-xs hover:underline">{t("dismiss")}</button>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("activeContracts"), value: activeContracts.length, icon: "📄", color: "text-blue-600 dark:text-blue-400" },
          { label: t("monthlyRevenue"), value: fmt(monthlyRevenue), icon: "💰", color: "text-green-600 dark:text-green-400" },
          { label: t("annualRevenue"), value: fmt(monthlyRevenue * 12), icon: "📈", color: "text-emerald-600 dark:text-emerald-400" },
          { label: t("dueForBilling"), value: dueCount, icon: "⏰", color: dueCount > 0 ? "text-orange-500" : "text-slate-500" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{s.icon}</span>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* New contract form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t("newContract")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t("customerName")} *</label>
              <input value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} placeholder="e.g. Ahmed Benali" className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t("customerPhone")} *</label>
              <input value={form.customerPhone} onChange={e => setForm(p => ({ ...p, customerPhone: e.target.value }))} placeholder="+212 6XX XXX XXX" className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t("deviceBrand")} *</label>
              <input value={form.deviceBrand} onChange={e => setForm(p => ({ ...p, deviceBrand: e.target.value }))} placeholder="e.g. Apple" className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t("deviceModel")} *</label>
              <input value={form.deviceModel} onChange={e => setForm(p => ({ ...p, deviceModel: e.target.value }))} placeholder="e.g. MacBook Pro 14" className={INPUT} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">{t("serviceDescription")}</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Monthly cleaning & diagnostics" className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t("monthlyPrice")} ({currency})</label>
              <input type="number" min="0" step="0.01" value={form.monthlyPrice} onChange={e => setForm(p => ({ ...p, monthlyPrice: e.target.value }))} placeholder="0.00" className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t("startDate")} *</label>
              <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t("endDate")}</label>
              <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t("notes")}</label>
              <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder={t("internalNotes")} className={INPUT} />
            </div>
          </div>
          <button
            onClick={createContract}
            disabled={saving || !form.customerName || !form.customerPhone || !form.deviceBrand || !form.deviceModel || !form.startDate}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {saving ? t("creating") : t("createContract")}
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 w-fit">
        {(["ALL", "ACTIVE", "PAUSED", "CANCELLED"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === f ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            {f === "ALL" ? `All (${contracts.length})` : `${f.charAt(0) + f.slice(1).toLowerCase()} (${contracts.filter(c => c.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Contracts list */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">{t("loadingContracts")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-3xl mb-3">📄</p>
          <p className="text-slate-500 text-sm font-medium">No {filter !== "ALL" ? filter.toLowerCase() + " " : ""}{t("noContractsYet")}</p>
          <p className="text-slate-400 text-xs mt-1">{t("createContractHint")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const billing = nextBillingLabel(c.nextBillingDate);
            const isEditing = editId === c.id;
            return (
              <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {/* Main row */}
                <div className="p-4 flex flex-wrap items-start gap-3">
                  {/* Status badge */}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${STATUS_STYLES[c.status]}`}>
                    {c.status}
                  </span>

                  {/* Customer + device */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{c.customerName}</p>
                    <p className="text-xs text-slate-500">{c.customerPhone}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{c.deviceBrand} {c.deviceModel}</p>
                    {c.description && <p className="text-xs text-slate-400 mt-0.5 italic">{c.description}</p>}
                  </div>

                  {/* Price + billing */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-slate-900 dark:text-white">{fmt(c.monthlyPrice)}<span className="text-xs font-normal text-slate-400">/mo</span></p>
                    <p className={`text-xs mt-0.5 ${billing.cls}`}>{t("nextBilling")} {billing.label}</p>
                    {c.endDate && (
                      <p className="text-xs text-slate-400 mt-0.5">{t("endsOn")} {new Date(c.endDate).toLocaleDateString()}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => isEditing ? setEditId(null) : openEdit(c)}
                      className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">
                      {isEditing ? "✕" : t("editContract")}
                    </button>
                    {c.status === "ACTIVE" && (
                      <button onClick={() => quickStatus(c.id, "PAUSED")}
                        className="text-xs px-2.5 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-lg transition-colors">
                        {t("pause")}
                      </button>
                    )}
                    {c.status === "PAUSED" && (
                      <button onClick={() => quickStatus(c.id, "ACTIVE")}
                        className="text-xs px-2.5 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400 rounded-lg transition-colors">
                        {t("resume")}
                      </button>
                    )}
                    {c.status !== "CANCELLED" && (
                      <button onClick={() => quickStatus(c.id, "CANCELLED")}
                        className="text-xs px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors">
                        {t("cancel")}
                      </button>
                    )}
                    {user?.role === "ADMIN" && (
                      <button onClick={() => deleteContract(c.id)}
                        className="text-xs px-2 py-1 text-slate-400 hover:text-red-500 transition-colors">
                        🗑
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline edit panel */}
                {isEditing && (
                  <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{t("editContract")}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">{t("contractStatus")}</label>
                        <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))} className={INPUT}>
                          <option value="ACTIVE">Active</option>
                          <option value="PAUSED">Paused</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">{t("monthlyPrice")} ({currency})</label>
                        <input type="number" min="0" step="0.01" value={editForm.monthlyPrice} onChange={e => setEditForm(p => ({ ...p, monthlyPrice: e.target.value }))} className={INPUT} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">{t("endDate")}</label>
                        <input type="date" value={editForm.endDate ?? ""} onChange={e => setEditForm(p => ({ ...p, endDate: e.target.value }))} className={INPUT} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs text-slate-400 mb-1 block">{t("serviceDescription")}</label>
                        <input value={editForm.description ?? ""} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} className={INPUT} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">{t("notes")}</label>
                        <input value={editForm.notes ?? ""} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} className={INPUT} />
                      </div>
                    </div>
                    <button onClick={() => saveEdit(c.id)} disabled={savingEdit}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors">
                      {savingEdit ? t("savingLabel") : t("saveChanges")}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
