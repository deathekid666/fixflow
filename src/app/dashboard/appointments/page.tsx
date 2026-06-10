"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Appointment = {
  id: string; shopId: string;
  customerName: string; customerPhone: string;
  deviceBrand: string; deviceModel: string;
  faultDescription: string;
  scheduledAt: string; duration: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  notes: string | null; createdAt: string;
};

type FormState = {
  customerName: string; customerPhone: string;
  deviceBrand: string; deviceModel: string;
  faultDescription: string; scheduledAt: string;
  duration: string; notes: string;
};

const HOUR_H = 64;
const START_H = 8;
const END_H = 21;
const HOURS = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-yellow-500/20 border-yellow-400 text-yellow-800 dark:text-yellow-200",
  CONFIRMED: "bg-blue-500/20 border-blue-400 text-blue-800 dark:text-blue-200",
  CANCELLED: "bg-slate-400/20 border-slate-400 text-slate-500 dark:text-slate-400",
  COMPLETED: "bg-green-500/20 border-green-400 text-green-800 dark:text-green-200",
};
const STATUS_DOT: Record<string, string> = {
  PENDING: "bg-yellow-500", CONFIRMED: "bg-blue-500",
  CANCELLED: "bg-slate-400", COMPLETED: "bg-green-500",
};

const EMPTY_FORM: FormState = {
  customerName: "", customerPhone: "", deviceBrand: "",
  deviceModel: "", faultDescription: "", scheduledAt: "", duration: "60", notes: "",
};

function getWeekStart(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function fmt(d: Date, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", opts).format(d);
}

function toLocalDatetimeInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AppointmentsPage() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [editForm, setEditForm] = useState<Partial<FormState & { status: string }>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [converting, setConverting] = useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  useEffect(() => { load(); }, [weekStart]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (9 - START_H) * HOUR_H;
    }
  }, []);

  async function load() {
    setLoading(true);
    const start = weekStart.toISOString();
    const end = weekEnd.toISOString();
    const res = await fetch(`/api/appointments?start=${start}&end=${end}`, { credentials: "include" });
    if (res.ok) setAppointments(await res.json());
    setLoading(false);
  }

  function openNewOnSlot(day: Date, hour: number) {
    const dt = new Date(day);
    dt.setHours(hour, 0, 0, 0);
    setForm({ ...EMPTY_FORM, scheduledAt: toLocalDatetimeInput(dt) });
    setShowForm(true);
    setSelected(null);
  }

  async function createAppointment() {
    if (!form.customerName || !form.customerPhone || !form.deviceBrand || !form.deviceModel || !form.faultDescription || !form.scheduledAt) return;
    setSaving(true);
    const res = await fetch("/api/appointments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...form, scheduledAt: new Date(form.scheduledAt).toISOString() }),
    });
    if (res.ok) {
      const appt = await res.json();
      setAppointments(prev => [...prev, appt].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()));
      setShowForm(false);
      setForm(EMPTY_FORM);
    }
    setSaving(false);
  }

  function openEdit(appt: Appointment) {
    setSelected(appt);
    setShowForm(false);
    setEditForm({
      customerName: appt.customerName, customerPhone: appt.customerPhone,
      deviceBrand: appt.deviceBrand, deviceModel: appt.deviceModel,
      faultDescription: appt.faultDescription,
      scheduledAt: toLocalDatetimeInput(new Date(appt.scheduledAt)),
      duration: String(appt.duration),
      notes: appt.notes ?? "",
      status: appt.status,
    });
  }

  async function saveEdit() {
    if (!selected) return;
    setSavingEdit(true);
    const res = await fetch(`/api/appointments/${selected.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ...editForm,
        scheduledAt: editForm.scheduledAt ? new Date(editForm.scheduledAt).toISOString() : undefined,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
      setSelected(updated);
    }
    setSavingEdit(false);
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAppointments(prev => prev.map(a => a.id === id ? updated : a));
      if (selected?.id === id) setSelected(updated);
    }
  }

  async function deleteAppt(id: string) {
    if (!confirm("Delete this appointment?")) return;
    const res = await fetch(`/api/appointments/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      setAppointments(prev => prev.filter(a => a.id !== id));
      setSelected(null);
    }
  }

  async function convertToWorkOrder(appt: Appointment) {
    setConverting(true);
    const res = await fetch("/api/workorders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        customerName: appt.customerName,
        customerPhone: appt.customerPhone,
        deviceBrand: appt.deviceBrand,
        deviceModel: appt.deviceModel,
        faultDescription: appt.faultDescription,
        serviceType: "IN_STORE",
        faultLevel: "LOW",
      }),
    });
    if (res.ok) {
      const order = await res.json();
      await updateStatus(appt.id, "COMPLETED");
      router.push(`/dashboard/workorders/${order.id}`);
    } else {
      const err = await res.json();
      alert(err.error || "Failed to create work order");
    }
    setConverting(false);
  }

  function apptStyle(appt: Appointment): React.CSSProperties {
    const start = new Date(appt.scheduledAt);
    const topPx = ((start.getHours() - START_H) * 60 + start.getMinutes()) * (HOUR_H / 60);
    const heightPx = Math.max(appt.duration * (HOUR_H / 60), 24);
    return { position: "absolute", top: topPx, height: heightPx, left: 2, right: 2, zIndex: 10 };
  }

  const INPUT = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500";

  const panelOpen = showForm || !!selected;

  return (
    <div className="flex h-[calc(100vh-57px)] lg:h-screen overflow-hidden">
      {/* Main calendar area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all ${panelOpen ? "lg:mr-96" : ""}`}>
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={() => setWeekStart(getWeekStart(new Date()))}
                className="px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">
                Today
              </button>
              <button onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white">
              {fmt(weekStart, { month: "short", day: "numeric" })} — {fmt(new Date(weekEnd.getTime() - 1), { month: "short", day: "numeric", year: "numeric" })}
            </h1>
          </div>
          <button onClick={() => { setShowForm(true); setSelected(null); setForm(EMPTY_FORM); }}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-1.5">
            <span className="text-base leading-none">+</span> New Appointment
          </button>
        </div>

        {/* Calendar */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Day headers */}
          <div className="flex-shrink-0 flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="w-14 flex-shrink-0" />
            {weekDays.map((day, i) => {
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div key={i} className="flex-1 text-center py-2 border-l border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">{fmt(day, { weekday: "short" })}</div>
                  <div className={`text-sm font-semibold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full mx-auto ${isToday ? "bg-blue-600 text-white" : "text-slate-900 dark:text-white"}`}>
                    {fmt(day, { day: "numeric" })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scrollable time grid */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="flex" style={{ height: HOURS.length * HOUR_H }}>
              {/* Time labels */}
              <div className="w-14 flex-shrink-0 relative">
                {HOURS.map(h => (
                  <div key={h} style={{ height: HOUR_H }} className="relative">
                    <span className="absolute -top-2.5 right-2 text-xs text-slate-400 dark:text-slate-500">
                      {h === 12 ? "12pm" : h < 12 ? `${h}am` : `${h - 12}pm`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDays.map((day, di) => {
                const dayAppts = appointments.filter(a => {
                  const d = new Date(a.scheduledAt);
                  return d.toDateString() === day.toDateString();
                });
                return (
                  <div key={di} className="flex-1 border-l border-slate-200 dark:border-slate-800 relative">
                    {/* Hour slot lines */}
                    {HOURS.map(h => (
                      <div key={h} style={{ height: HOUR_H }}
                        className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                        onClick={() => openNewOnSlot(day, h)}>
                        <div className="h-1/2 border-b border-dashed border-slate-100 dark:border-slate-800/40" />
                      </div>
                    ))}

                    {/* Appointment blocks */}
                    {dayAppts.map(appt => (
                      <div key={appt.id}
                        style={apptStyle(appt)}
                        onClick={e => { e.stopPropagation(); openEdit(appt); }}
                        className={`cursor-pointer rounded-lg border-l-4 px-2 py-1 overflow-hidden transition-opacity hover:opacity-90 ${STATUS_STYLES[appt.status] ?? STATUS_STYLES.PENDING} ${selected?.id === appt.id ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900" : ""}`}>
                        <p className="text-xs font-semibold leading-tight truncate">{appt.customerName}</p>
                        {appt.duration >= 45 && <p className="text-xs opacity-75 truncate">{appt.deviceBrand} {appt.deviceModel}</p>}
                        {appt.duration >= 60 && <p className="text-xs opacity-60 truncate">{fmt(new Date(appt.scheduledAt), { hour: "2-digit", minute: "2-digit" })}</p>}
                      </div>
                    ))}

                    {/* Current time indicator */}
                    {day.toDateString() === new Date().toDateString() && (() => {
                      const now = new Date();
                      const top = ((now.getHours() - START_H) * 60 + now.getMinutes()) * (HOUR_H / 60);
                      if (top < 0 || top > HOURS.length * HOUR_H) return null;
                      return (
                        <div style={{ position: "absolute", top, left: 0, right: 0, zIndex: 20 }} className="pointer-events-none">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                            <div className="flex-1 h-px bg-red-500" />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Side panel */}
      {panelOpen && (
        <div className="fixed right-0 top-0 bottom-0 lg:top-auto w-full lg:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col z-40 shadow-xl lg:shadow-none">
          <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {showForm ? "New Appointment" : "Appointment Details"}
            </h2>
            <button onClick={() => { setShowForm(false); setSelected(null); }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* New appointment form */}
            {showForm && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 mb-1 block">Customer Name *</label>
                    <input className={INPUT} value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} placeholder="Full name" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Phone *</label>
                    <input className={INPUT} value={form.customerPhone} onChange={e => setForm(p => ({ ...p, customerPhone: e.target.value }))} placeholder="+212 6XX XXX XXX" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Date & Time *</label>
                    <input type="datetime-local" className={INPUT} value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Device Brand *</label>
                    <input className={INPUT} value={form.deviceBrand} onChange={e => setForm(p => ({ ...p, deviceBrand: e.target.value }))} placeholder="Samsung, Apple..." />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Model *</label>
                    <input className={INPUT} value={form.deviceModel} onChange={e => setForm(p => ({ ...p, deviceModel: e.target.value }))} placeholder="Galaxy S23..." />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 mb-1 block">Issue Description *</label>
                    <input className={INPUT} value={form.faultDescription} onChange={e => setForm(p => ({ ...p, faultDescription: e.target.value }))} placeholder="Describe the issue..." />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Duration (min)</label>
                    <select className={INPUT} value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}>
                      {[15, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Notes</label>
                    <input className={INPUT} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional" />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={createAppointment} disabled={saving || !form.customerName || !form.customerPhone || !form.deviceBrand || !form.deviceModel || !form.faultDescription || !form.scheduledAt}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors">
                    {saving ? "Saving..." : "Create Appointment"}
                  </button>
                </div>
              </div>
            )}

            {/* View/edit existing */}
            {selected && !showForm && (
              <div className="space-y-4">
                {/* Status badge + quick actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${STATUS_STYLES[selected.status]}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${STATUS_DOT[selected.status]}`} />
                    {selected.status}
                  </span>
                  {selected.status === "PENDING" && (
                    <button onClick={() => updateStatus(selected.id, "CONFIRMED")}
                      className="text-xs px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-600 dark:text-blue-400 rounded-lg transition-colors">
                      Confirm
                    </button>
                  )}
                  {selected.status !== "CANCELLED" && selected.status !== "COMPLETED" && (
                    <button onClick={() => updateStatus(selected.id, "CANCELLED")}
                      className="text-xs px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors">
                      Cancel
                    </button>
                  )}
                </div>

                {/* Convert to work order */}
                {selected.status !== "CANCELLED" && selected.status !== "COMPLETED" && (
                  <button onClick={() => convertToWorkOrder(selected)} disabled={converting}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                    {converting ? (
                      <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Creating Work Order...</>
                    ) : (
                      <><span>📋</span> Convert to Work Order</>
                    )}
                  </button>
                )}

                {/* Edit fields */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Edit Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs text-slate-500 mb-1 block">Customer Name</label>
                      <input className={INPUT} value={editForm.customerName ?? ""} onChange={e => setEditForm(p => ({ ...p, customerName: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Phone</label>
                      <input className={INPUT} value={editForm.customerPhone ?? ""} onChange={e => setEditForm(p => ({ ...p, customerPhone: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Date & Time</label>
                      <input type="datetime-local" className={INPUT} value={editForm.scheduledAt ?? ""} onChange={e => setEditForm(p => ({ ...p, scheduledAt: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Brand</label>
                      <input className={INPUT} value={editForm.deviceBrand ?? ""} onChange={e => setEditForm(p => ({ ...p, deviceBrand: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Model</label>
                      <input className={INPUT} value={editForm.deviceModel ?? ""} onChange={e => setEditForm(p => ({ ...p, deviceModel: e.target.value }))} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-slate-500 mb-1 block">Issue</label>
                      <input className={INPUT} value={editForm.faultDescription ?? ""} onChange={e => setEditForm(p => ({ ...p, faultDescription: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Duration (min)</label>
                      <select className={INPUT} value={editForm.duration ?? "60"} onChange={e => setEditForm(p => ({ ...p, duration: e.target.value }))}>
                        {[15, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Status</label>
                      <select className={INPUT} value={editForm.status ?? selected.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
                        {["PENDING","CONFIRMED","CANCELLED","COMPLETED"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-slate-500 mb-1 block">Notes</label>
                      <input className={INPUT} value={editForm.notes ?? ""} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={savingEdit}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors">
                      {savingEdit ? "Saving..." : "Save Changes"}
                    </button>
                    <button onClick={() => deleteAppt(selected.id)}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-lg transition-colors">
                      Delete
                    </button>
                  </div>
                </div>

                {/* Info summary */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 space-y-1">
                  <div>{selected.customerPhone}</div>
                  <div>Created {fmt(new Date(selected.createdAt), { day: "numeric", month: "short", year: "numeric" })}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile overlay backdrop */}
      {panelOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => { setShowForm(false); setSelected(null); }} />
      )}
    </div>
  );
}
