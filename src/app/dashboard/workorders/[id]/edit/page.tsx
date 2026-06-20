"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

type WorkOrder = {
  id: string;
  deviceBrand: string;
  deviceModel: string;
  serialNumber: string;
  imei: string;
  warrantyStart: string | null;
  warrantyEnd: string | null;
  isUnderWarranty: boolean;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  faultDescription: string;
  appearance: string;
  remarks: string;
  serviceType: string;
  repairType: string;
  faultLevel: string;
};

const INPUT = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500";

export default function EditWorkOrderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const isAdmin = user?.role === "ADMIN";
  const [form, setForm] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/workorders/${params.id}`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { setForm(data); setLoading(false); });
  }, []);

  function set(field: string, value: string | boolean) {
    setForm(prev => prev ? { ...prev, [field]: value } : prev);
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/workorders/${params.id}/edit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push(`/dashboard/workorders/${params.id}`);
    } else {
      const d = await res.json();
      setError(d.error || t("failedToSave"));
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="p-6 max-w-3xl mx-auto space-y-4 animate-pulse">
      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-40" />
      {[0,1,2,3].map(i => (
        <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
      ))}
    </div>
  );
  if (!form) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm">← {t("back")}</button>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t("editWorkOrderTitle")}</h1>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}

      {/* Admin-only: Device & Customer info */}
      {isAdmin && (
        <>
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">{t("deviceInformation")} <span className="text-blue-600 dark:text-blue-400 normal-case text-xs ml-1">{t("adminOnly")}</span></h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label={`${t("brand")} *`} value={form.deviceBrand} onChange={v => set("deviceBrand", v)} />
              <Field label={`${t("model")} *`} value={form.deviceModel} onChange={v => set("deviceModel", v)} />
              <Field label={t("serialNumber")} value={form.serialNumber} onChange={v => set("serialNumber", v)} />
              <Field label={t("imei")} value={form.imei} onChange={v => set("imei", v)} />
              <Field label={t("warrantyStart")} type="date" value={form.warrantyStart ? form.warrantyStart.slice(0, 10) : ""} onChange={v => set("warrantyStart", v)} />
              <Field label={t("warrantyEnd")} type="date" value={form.warrantyEnd ? form.warrantyEnd.slice(0, 10) : ""} onChange={v => set("warrantyEnd", v)} />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
              <input type="checkbox" checked={form.isUnderWarranty} onChange={e => set("isUnderWarranty", e.target.checked)} className="rounded" />
              {t("underWarranty")}
            </label>
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">{t("customerInformation")} <span className="text-blue-600 dark:text-blue-400 normal-case text-xs ml-1">{t("adminOnly")}</span></h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label={`${t("name")} *`} value={form.customerName} onChange={v => set("customerName", v)} />
              <Field label={`${t("phone")} *`} value={form.customerPhone} onChange={v => set("customerPhone", v)} />
              <div className="col-span-2">
                <Field label={t("email")} value={form.customerEmail} onChange={v => set("customerEmail", v)} />
              </div>
            </div>
          </section>
        </>
      )}

      {/* Everyone can edit fault & service */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">{t("faultAndService")}</h2>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">{t("faultDescriptionLabel")}</label>
          <textarea rows={3}
            className={INPUT + " resize-none"}
            value={form.faultDescription}
            onChange={e => set("faultDescription", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("appearanceLabel")} value={form.appearance} onChange={v => set("appearance", v)} />
          <Field label={t("repairTypeLabel")} value={form.repairType} onChange={v => set("repairType", v)} />
          <div>
            <label className="text-xs text-slate-500 mb-1 block">{t("serviceTypeLabel")}</label>
            <select className={INPUT}
              value={form.serviceType} onChange={e => set("serviceType", e.target.value)}>
              <option value="IN_STORE">In Store</option>
              <option value="ON_SITE">On Site</option>
              <option value="RETRIEVAL">Retrieval</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">{t("faultLevelLabel")}</label>
            <select className={INPUT}
              value={form.faultLevel} onChange={e => set("faultLevel", e.target.value)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">{t("remarksLabel")}</label>
          <textarea rows={2}
            className={INPUT + " resize-none"}
            value={form.remarks}
            onChange={e => set("remarks", e.target.value)} />
        </div>
      </section>

      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
        {saving ? t("saving") : t("saveChanges")}
      </button>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-slate-500 mb-1 block">{label}</label>
      <input type={type}
        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        value={value ?? ""} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
