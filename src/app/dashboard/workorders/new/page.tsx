"use client";

import UpgradeModal from "@/components/UpgradeModal";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/currency";

type CustomerHistory = {
  name: string; phone: string; email: string;
  totalOrders: number; lastVisit: string; statuses: string[];
};

type DefaultPart = { sparePartId: string; quantity: number };
type DefaultLineItem = { label: string; amount: number };

type Template = {
  id: string; name: string; category: string;
  deviceBrand: string; deviceModel: string;
  faultDescription: string; repairType: string;
  faultLevel: string; serviceType: string;
  defaultPrice: number; estimatedDuration: number;
  defaultParts: DefaultPart[];
  defaultLineItems: DefaultLineItem[];
};

const INPUT = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500";

export default function NewWorkOrderPage() {
  const { user } = useAuth();
  const currency = user?.shop?.currency ?? "MAD";
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState({ limit: 50, current: 50 });
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imeiScanHint, setImeiScanHint] = useState(false);
  const imeiRef = useRef<HTMLInputElement>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [customerHistory, setCustomerHistory] = useState<CustomerHistory | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const phoneTimer = useRef<NodeJS.Timeout | null>(null);
  const [filterCategory, setFilterCategory] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);
  const [intakePhotos, setIntakePhotos] = useState<{ file: File; preview: string }[]>([]);
  const [photoError, setPhotoError] = useState(false);

  type AiEstimate = { duration: string; parts: string[]; costRange: string; successRate: number };
  const [aiEstimate, setAiEstimate] = useState<AiEstimate | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const aiTimer = useRef<NodeJS.Timeout | null>(null);

  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    deviceBrand: "", deviceModel: "", serialNumber: "", imei: "",
    warrantyStart: "", warrantyEnd: "", isUnderWarranty: false,
    customerName: "", customerPhone: "", customerEmail: "",
    faultDescription: "", appearance: "", remarks: "",
    serviceType: "IN_STORE", repairType: "", faultLevel: "LOW",
    branchId: "",
  });

  useEffect(() => {
    fetch("/api/templates", { credentials: "include" })
      .then(r => r.json()).then(d => setTemplates(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/branches", { credentials: "include" })
      .then(r => r.json()).then(d => setBranches(Array.isArray(d) ? d.filter((b: { isActive: boolean }) => b.isActive) : [])).catch(() => {});
  }, []);

  function set(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function applyTemplate(t: Template) {
    setForm(prev => ({
      ...prev,
      deviceBrand: t.deviceBrand || prev.deviceBrand,
      deviceModel: t.deviceModel || prev.deviceModel,
      faultDescription: t.faultDescription || prev.faultDescription,
      repairType: t.repairType || prev.repairType,
      faultLevel: t.faultLevel || prev.faultLevel,
      serviceType: t.serviceType || prev.serviceType,
    }));
    setSelectedTemplate(t);
    setShowTemplates(false);
  }

  useEffect(() => {
    if (phoneTimer.current) clearTimeout(phoneTimer.current);
    if (!form.customerPhone || form.customerPhone.length < 6) { setCustomerHistory(null); return; }
    phoneTimer.current = setTimeout(() => lookupCustomer(form.customerPhone), 600);
    return () => { if (phoneTimer.current) clearTimeout(phoneTimer.current); };
  }, [form.customerPhone]);

  useEffect(() => {
    if (aiTimer.current) clearTimeout(aiTimer.current);
    if (!form.deviceBrand.trim() || !form.deviceModel.trim() || form.faultDescription.trim().length < 10) {
      setAiEstimate(null); setAiLoading(false); setAiError(""); return;
    }
    setAiEstimate(null); setAiLoading(true); setAiError("");
    aiTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/ai/repair-estimate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ brand: form.deviceBrand, model: form.deviceModel, faultDescription: form.faultDescription }),
        });
        if (res.status === 503) { setAiLoading(false); return; }
        const data = await res.json();
        if (!res.ok) { setAiError("Estimate unavailable"); setAiLoading(false); return; }
        setAiEstimate(data);
      } catch { setAiError("Could not reach AI"); }
      finally { setAiLoading(false); }
    }, 900);
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current); };
  }, [form.deviceBrand, form.deviceModel, form.faultDescription]);

  async function lookupCustomer(phone: string) {
    setLookingUp(true);
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(phone)}`, { credentials: "include" });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const match = data.find((c: CustomerHistory) => c.phone === phone) ?? data[0];
        setCustomerHistory(match);
        if (!form.customerName) set("customerName", match.name);
        if (!form.customerEmail && match.email) set("customerEmail", match.email);
      } else { setCustomerHistory(null); }
    } catch { setCustomerHistory(null); }
    finally { setLookingUp(false); }
  }

  function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setIntakePhotos(prev => [...prev, { file, preview: ev.target?.result as string }]);
      };
      reader.readAsDataURL(file);
    });
    if (files.length > 0) setPhotoError(false);
    if (photoRef.current) photoRef.current.value = "";
  }

  function removePhoto(i: number) {
    setIntakePhotos(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    setError("");
    if (intakePhotos.length === 0) {
      setPhotoError(true);
      document.getElementById("device-photos-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!form.deviceBrand || !form.deviceModel || !form.customerName || !form.customerPhone || !form.faultDescription) {
      setError("Please fill in all required fields."); return;
    }
    setLoading(true);

    const res = await fetch("/api/workorders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.limitReached && !user?.isSuperAdmin) {
        setUpgradeInfo({ limit: data.limit, current: data.current });
        setShowUpgradeModal(true);
        setLoading(false);
        return;
      }
      setError(data.error || "Failed to create work order");
      setLoading(false);
      return;
    }

    const workOrderId = data.id;

    if (intakePhotos.length > 0) {
      await Promise.all(intakePhotos.map(async ({ file }) => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("tag", "intake");
        await fetch(`/api/workorders/${workOrderId}/attachments`, {
          method: "POST", credentials: "include", body: fd,
        });
      }));
    }

    if (selectedTemplate) {
      const parts = Array.isArray(selectedTemplate.defaultParts) ? selectedTemplate.defaultParts : [];
      const items = Array.isArray(selectedTemplate.defaultLineItems) ? selectedTemplate.defaultLineItems : [];
      await Promise.all([
        ...parts.map((p: DefaultPart) =>
          fetch(`/api/workorders/${workOrderId}/parts`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ sparePartId: p.sparePartId, quantity: p.quantity }),
          })
        ),
        ...items.map((li: DefaultLineItem) =>
          fetch(`/api/workorders/${workOrderId}/lineitems`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ label: li.label, amount: li.amount }),
          })
        ),
      ]);
    }

    // Fire confetti + flag for first-ever work order
    const firstWoKey = `fixflow_first_wo_${user?.shopId ?? ""}`;
    if (!localStorage.getItem(firstWoKey)) {
      localStorage.setItem(firstWoKey, "1");
      import("canvas-confetti").then((mod) => {
        const fire = mod.default ?? mod;
        fire({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
        setTimeout(() => fire({ particleCount: 60, spread: 120, origin: { y: 0.45 }, angle: 60 }), 300);
        setTimeout(() => fire({ particleCount: 60, spread: 120, origin: { y: 0.45 }, angle: 120 }), 600);
      });
      await new Promise((r) => setTimeout(r, 900));
    }

    router.push(`/dashboard/workorders/${workOrderId}`);
  }

  const categories = [...new Set(templates.map(t => t.category).filter(Boolean))];
  const filteredTemplates = filterCategory ? templates.filter(t => t.category === filterCategory) : templates;

  function formatDuration(mins: number) {
    if (!mins) return null;
    if (mins < 60) return `${mins}min`;
    return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}min` : ""}`;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          feature="work orders"
          limit={upgradeInfo.limit}
          current={upgradeInfo.current}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm">← Back</button>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">New Work Order</h1>
        </div>
        <button onClick={() => setShowTemplates(!showTemplates)}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-lg transition-colors flex items-center gap-2">
          <span>🗂️</span>
          {showTemplates ? "Hide Templates" : "Use Template"}
          {templates.length > 0 && <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">{templates.length}</span>}
        </button>
      </div>

      {selectedTemplate && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800/50 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Template applied: {selectedTemplate.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {Array.isArray(selectedTemplate.defaultParts) && selectedTemplate.defaultParts.length > 0 && `${selectedTemplate.defaultParts.length} parts · `}
              {Array.isArray(selectedTemplate.defaultLineItems) && selectedTemplate.defaultLineItems.length > 0 && `${selectedTemplate.defaultLineItems.length} services · `}
              {selectedTemplate.estimatedDuration > 0 && `Est. ${formatDuration(selectedTemplate.estimatedDuration)}`}
            </p>
          </div>
          <button onClick={() => setSelectedTemplate(null)} className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">✕ Clear</button>
        </div>
      )}

      {showTemplates && (
        <div className="bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800/50 rounded-xl p-4 space-y-3">
          <p className="text-xs text-slate-500 font-medium">Select a template to auto-fill the form:</p>
          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFilterCategory("")} className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${!filterCategory ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>All</button>
              {categories.map(c => (
                <button key={c} onClick={() => setFilterCategory(c)} className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${filterCategory === c ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>{c}</button>
              ))}
            </div>
          )}
          {filteredTemplates.length === 0 ? (
            <p className="text-xs text-slate-500">No templates yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredTemplates.map(t => (
                <button key={t.id} onClick={() => applyTemplate(t)}
                  className="text-left bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-lg p-3 transition-colors space-y-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{t.name}</p>
                  {(t.deviceBrand || t.deviceModel) && <p className="text-xs text-slate-500">{t.deviceBrand} {t.deviceModel}</p>}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {t.defaultPrice > 0 && <span className="text-xs text-emerald-600 dark:text-emerald-400">{formatCurrency(t.defaultPrice, currency)}</span>}
                    {t.estimatedDuration > 0 && <span className="text-xs text-blue-600 dark:text-blue-400">⏱ {formatDuration(t.estimatedDuration)}</span>}
                    {Array.isArray(t.defaultParts) && t.defaultParts.length > 0 && <span className="text-xs text-slate-500">🔧 {t.defaultParts.length} parts</span>}
                    {Array.isArray(t.defaultLineItems) && t.defaultLineItems.length > 0 && <span className="text-xs text-slate-500">💰 {t.defaultLineItems.length} services</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step progress indicator */}
      <div className="flex items-center justify-between">
        {[
          { n: 1, label: "Device Info" },
          { n: 2, label: "Customer" },
          { n: 3, label: "Fault & Photos" },
        ].map((step, i, arr) => (
          <div key={step.n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-7 h-7 rounded-full border-2 border-blue-500 bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
                {step.n}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{step.label}</span>
            </div>
            {i < arr.length - 1 && <div className="flex-1 h-0.5 bg-blue-500/40 mx-2 mb-5" />}
          </div>
        ))}
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}

      {/* Device Info */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Device Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Brand *" value={form.deviceBrand} onChange={v => set("deviceBrand", v)} placeholder="e.g. Samsung, Apple" />
          <Field label="Model *" value={form.deviceModel} onChange={v => set("deviceModel", v)} placeholder="e.g. Galaxy S22" />
          <Field label="Serial Number" value={form.serialNumber} onChange={v => set("serialNumber", v)} placeholder="SN" />
          <div>
            <label className="text-xs text-slate-500 mb-1 block">IMEI</label>
            <div className="relative">
              <input
                ref={imeiRef}
                type="text"
                placeholder="IMEI"
                value={form.imei}
                onChange={e => set("imei", e.target.value)}
                onFocus={e => { const t = e.target; setTimeout(() => t.scrollIntoView({ behavior: "smooth", block: "center" }), 300); }}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 pr-20 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  imeiRef.current?.focus();
                  setImeiScanHint(true);
                  setTimeout(() => setImeiScanHint(false), 4000);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors leading-tight"
              >
                ▌▌▌ Scan
              </button>
            </div>
            {imeiScanHint && (
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 animate-pulse">Field focused — scan barcode now…</p>
            )}
          </div>
          <Field label="Warranty Start" type="date" value={form.warrantyStart} onChange={v => set("warrantyStart", v)} />
          <Field label="Warranty End" type="date" value={form.warrantyEnd} onChange={v => set("warrantyEnd", v)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
          <input type="checkbox" checked={form.isUnderWarranty} onChange={e => set("isUnderWarranty", e.target.checked)} className="rounded border-slate-300 dark:border-slate-600" />
          Device is under warranty
        </label>
      </section>

      {/* Device Photos */}
      <section id="device-photos-section" className={`bg-white dark:bg-slate-900 rounded-xl p-5 space-y-4 border ${photoError && intakePhotos.length === 0 ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-800"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
              Device Photos <span className="text-red-500">*</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Document device condition on intake — protects against disputes</p>
          </div>
          <button onClick={() => photoRef.current?.click()}
            className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-1.5">
            📷 Add Photos
          </button>
          <input ref={photoRef} type="file" className="hidden" accept="image/*" multiple onChange={onPhotoSelected} />
        </div>
        {intakePhotos.length === 0 ? (
          <>
            <button onClick={() => photoRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-colors group ${
                photoError
                  ? "border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-950/20"
                  : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
              }`}>
              <p className="text-3xl mb-2">📷</p>
              <p className={`text-sm ${photoError ? "text-red-600 dark:text-red-400 font-medium" : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"}`}>Click to add device photos</p>
              <p className="text-xs text-slate-400 mt-1">Front, back, sides, any existing damage</p>
            </button>
            {photoError && (
              <>
                <p className="text-sm font-medium text-red-500 dark:text-red-400">⚠ Device photo is required</p>
                <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>At least one device photo is required</p>
              </>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {intakePhotos.map((p, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 aspect-square">
                  <img src={p.preview} alt={`Intake photo ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => removePhoto(i)} className="bg-red-600 hover:bg-red-500 text-white text-xs px-2 py-1 rounded-lg">Remove</button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                    <p className="text-xs text-white truncate">{p.file.name}</p>
                  </div>
                </div>
              ))}
              <button onClick={() => photoRef.current?.click()}
                className="aspect-square border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors group">
                <span className="text-2xl text-slate-400">+</span>
                <span className="text-xs text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300">Add more</span>
              </button>
            </div>
            <p className="text-xs text-slate-500">{intakePhotos.length} photo{intakePhotos.length !== 1 ? "s" : ""} added</p>
          </div>
        )}
      </section>

      {/* Customer Info */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Customer Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Phone *</label>
            <div className="relative">
              <input type="text" placeholder="+212..."
                className={INPUT}
                value={form.customerPhone} onChange={e => set("customerPhone", e.target.value)} />
              {lookingUp && <span className="absolute right-3 top-2.5 text-xs text-slate-400">🔍</span>}
            </div>
          </div>
          <Field label="Name *" value={form.customerName} onChange={v => set("customerName", v)} placeholder="Full name" />
          <div className="col-span-2">
            <Field label="Email" value={form.customerEmail} onChange={v => set("customerEmail", v)} placeholder="customer@email.com" />
          </div>
        </div>
        {customerHistory && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">👤 Returning Customer</p>
              <button onClick={() => { set("customerName", customerHistory.name); set("customerEmail", customerHistory.email || ""); }}
                className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                Use this customer
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div><p className="text-slate-500">Name</p><p className="text-slate-800 dark:text-slate-200 font-medium">{customerHistory.name}</p></div>
              <div><p className="text-slate-500">Total Orders</p><p className="text-slate-800 dark:text-slate-200 font-medium">{customerHistory.totalOrders}</p></div>
              <div><p className="text-slate-500">Last Visit</p><p className="text-slate-800 dark:text-slate-200 font-medium">{new Date(customerHistory.lastVisit).toLocaleDateString()}</p></div>
            </div>
          </div>
        )}
      </section>

      {/* Fault Info */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Fault & Service</h2>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Fault Description *</label>
          <textarea rows={3} placeholder="Describe the fault..."
            className={INPUT + " resize-none"}
            value={form.faultDescription} onChange={e => set("faultDescription", e.target.value)} />
        </div>

        {/* AI Repair Estimate */}
        {(aiLoading || aiEstimate || aiError) && (
          <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/60 dark:bg-blue-950/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">✨</span>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">AI Repair Estimate</span>
              </div>
              <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-500 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">beta</span>
            </div>
            {aiLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[0,1,2,3].map(i => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-2.5 w-20 bg-blue-200 dark:bg-blue-800/60 rounded animate-pulse" />
                    <div className="h-4 bg-blue-200 dark:bg-blue-800/60 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : aiError ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">Estimate unavailable — {aiError}</p>
            ) : aiEstimate ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Est. Duration</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">⏱ {aiEstimate.duration}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Cost Range</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">💰 {aiEstimate.costRange}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Likely Parts</p>
                    {aiEstimate.parts.length === 0 ? (
                      <p className="text-xs text-slate-400">None expected</p>
                    ) : (
                      <ul className="space-y-0.5">
                        {aiEstimate.parts.map((p, i) => (
                          <li key={i} className="text-xs text-slate-700 dark:text-slate-300">🔧 {p}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">Success Rate</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-blue-200 dark:bg-blue-900/60 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            aiEstimate.successRate >= 80 ? "bg-green-500" :
                            aiEstimate.successRate >= 60 ? "bg-yellow-500" : "bg-orange-500"
                          }`}
                          style={{ width: `${aiEstimate.successRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 w-9 text-right">{aiEstimate.successRate}%</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 pt-3 border-t border-blue-200/60 dark:border-blue-800/30">
                  AI estimates are indicative only and may vary based on actual device condition.
                </p>
              </>
            ) : null}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Appearance" value={form.appearance} onChange={v => set("appearance", v)} placeholder="e.g. Good, Scratched" />
          <Field label="Repair Type" value={form.repairType} onChange={v => set("repairType", v)} placeholder="e.g. Screen Replacement" />
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Service Type</label>
            <select className={INPUT}
              value={form.serviceType} onChange={e => set("serviceType", e.target.value)}>
              <option value="IN_STORE">In Store</option>
              <option value="ON_SITE">On Site</option>
              <option value="RETRIEVAL">Retrieval</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Fault Level</label>
            <select className={INPUT}
              value={form.faultLevel} onChange={e => set("faultLevel", e.target.value)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          {branches.length > 0 && (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Branch</label>
              <select className={INPUT} value={form.branchId} onChange={e => set("branchId", e.target.value)}>
                <option value="">— No Branch —</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Remarks</label>
          <textarea rows={2} placeholder="Any additional remarks..."
            className={INPUT + " resize-none"}
            value={form.remarks} onChange={e => set("remarks", e.target.value)} />
        </div>
      </section>

      <button onClick={handleSubmit} disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
        {loading ? "Creating..." : "Create Work Order"}
      </button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const target = e.target;
    setTimeout(() => { target.scrollIntoView({ behavior: "smooth", block: "center" }); }, 300);
  };
  return (
    <div>
      <label className="text-xs text-slate-500 mb-1 block">{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        onFocus={handleFocus}
        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
    </div>
  );
}
