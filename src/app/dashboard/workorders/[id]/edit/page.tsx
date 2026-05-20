"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function EditWorkOrderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [form, setForm] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/workorders/${params.id}`)
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
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push(`/dashboard/workorders/${params.id}`);
    } else {
      const d = await res.json();
      setError(d.error || "Failed to save");
      setSaving(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Loading...</div>;
  if (!form) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white text-sm">← Back</button>
        <h1 className="text-xl font-semibold text-white">Edit Work Order</h1>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Device Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Brand *" value={form.deviceBrand} onChange={v => set("deviceBrand", v)} />
          <Field label="Model *" value={form.deviceModel} onChange={v => set("deviceModel", v)} />
          <Field label="Serial Number" value={form.serialNumber} onChange={v => set("serialNumber", v)} />
          <Field label="IMEI" value={form.imei} onChange={v => set("imei", v)} />
          <Field label="Warranty Start" type="date" value={form.warrantyStart ? form.warrantyStart.slice(0, 10) : ""} onChange={v => set("warrantyStart", v)} />
          <Field label="Warranty End" type="date" value={form.warrantyEnd ? form.warrantyEnd.slice(0, 10) : ""} onChange={v => set("warrantyEnd", v)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
          <input type="checkbox" checked={form.isUnderWarranty} onChange={e => set("isUnderWarranty", e.target.checked)} className="rounded" />
          Under warranty
        </label>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Customer Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name *" value={form.customerName} onChange={v => set("customerName", v)} />
          <Field label="Phone *" value={form.customerPhone} onChange={v => set("customerPhone", v)} />
          <div className="col-span-2">
            <Field label="Email" value={form.customerEmail} onChange={v => set("customerEmail", v)} />
          </div>
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Fault & Service</h2>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Fault Description *</label>
          <textarea rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            value={form.faultDescription}
            onChange={e => set("faultDescription", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Appearance" value={form.appearance} onChange={v => set("appearance", v)} />
          <Field label="Repair Type" value={form.repairType} onChange={v => set("repairType", v)} />
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Service Type</label>
            <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              value={form.serviceType} onChange={e => set("serviceType", e.target.value)}>
              <option value="IN_STORE">In Store</option>
              <option value="ON_SITE">On Site</option>
              <option value="RETRIEVAL">Retrieval</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Fault Level</label>
            <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              value={form.faultLevel} onChange={e => set("faultLevel", e.target.value)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Remarks</label>
          <textarea rows={2}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            value={form.remarks}
            onChange={e => set("remarks", e.target.value)} />
        </div>
      </section>

      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-slate-400 mb-1 block">{label}</label>
      <input type={type}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}