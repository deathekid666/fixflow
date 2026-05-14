"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewWorkOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    deviceBrand: "",
    deviceModel: "",
    serialNumber: "",
    imei: "",
    warrantyStart: "",
    warrantyEnd: "",
    isUnderWarranty: false,
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    faultDescription: "",
    appearance: "",
    remarks: "",
    serviceType: "IN_STORE",
    repairType: "",
    faultLevel: "LOW",
  });

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setError("");
    if (!form.deviceBrand || !form.deviceModel || !form.customerName || !form.customerPhone || !form.faultDescription) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/workorders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create work order");
      setLoading(false);
      return;
    }
    router.push(`/dashboard/workorders/${data.id}`);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white text-sm">← Back</button>
        <h1 className="text-xl font-semibold text-white">New Work Order</h1>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}

      {/* Device Info */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Device Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Brand *" value={form.deviceBrand} onChange={(v) => set("deviceBrand", v)} placeholder="e.g. Honor, Huawei" />
          <Field label="Model *" value={form.deviceModel} onChange={(v) => set("deviceModel", v)} placeholder="e.g. Magic V3" />
          <Field label="Serial Number" value={form.serialNumber} onChange={(v) => set("serialNumber", v)} placeholder="SN" />
          <Field label="IMEI" value={form.imei} onChange={(v) => set("imei", v)} placeholder="IMEI" />
          <Field label="Warranty Start" type="date" value={form.warrantyStart} onChange={(v) => set("warrantyStart", v)} />
          <Field label="Warranty End" type="date" value={form.warrantyEnd} onChange={(v) => set("warrantyEnd", v)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
          <input type="checkbox" checked={form.isUnderWarranty} onChange={(e) => set("isUnderWarranty", e.target.checked)}
            className="rounded border-slate-600" />
          Device is under warranty
        </label>
      </section>

      {/* Customer Info */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Customer Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name *" value={form.customerName} onChange={(v) => set("customerName", v)} placeholder="Full name" />
          <Field label="Phone *" value={form.customerPhone} onChange={(v) => set("customerPhone", v)} placeholder="+212..." />
          <div className="col-span-2">
            <Field label="Email" value={form.customerEmail} onChange={(v) => set("customerEmail", v)} placeholder="customer@email.com" />
          </div>
        </div>
      </section>

      {/* Fault Info */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Fault & Service</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Fault Description *</label>
            <textarea
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              rows={3}
              placeholder="Describe the fault..."
              value={form.faultDescription}
              onChange={(e) => set("faultDescription", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Appearance" value={form.appearance} onChange={(v) => set("appearance", v)} placeholder="e.g. Good, Scratched" />
            <Field label="Repair Type" value={form.repairType} onChange={(v) => set("repairType", v)} placeholder="e.g. Screen Replacement" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Service Type</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                value={form.serviceType} onChange={(e) => set("serviceType", e.target.value)}>
                <option value="IN_STORE">In Store</option>
                <option value="ON_SITE">On Site</option>
                <option value="RETRIEVAL">Retrieval</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Fault Level</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                value={form.faultLevel} onChange={(e) => set("faultLevel", e.target.value)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Remarks</label>
            <textarea
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              rows={2}
              placeholder="Any additional remarks..."
              value={form.remarks}
              onChange={(e) => set("remarks", e.target.value)}
            />
          </div>
        </div>
      </section>

      <button onClick={handleSubmit} disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
      >
        {loading ? "Creating..." : "Create Work Order"}
      </button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-slate-400 mb-1 block">{label}</label>
      <input
        type={type}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
