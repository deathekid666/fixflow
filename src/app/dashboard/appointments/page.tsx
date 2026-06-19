"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { buildWaUrl, fillTemplate, DEFAULT_TEMPLATES } from "@/lib/whatsapp";
import QRCode from "react-qr-code";

type Appointment = {
  id: string; shopId: string;
  customerName: string; customerPhone: string;
  deviceBrand: string; deviceModel: string;
  faultDescription: string;
  scheduledAt: string; duration: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  notes: string | null; createdAt: string;
  checkedInAt: string | null;
};

type WalkIn = {
  id: string; shopId: string;
  customerName: string; customerPhone: string;
  checkedInAt: string; workOrderId: string | null;
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
  PENDING:   "bg-yellow-500/15 border-yellow-500 text-yellow-800 dark:text-yellow-300",
  CONFIRMED: "bg-green-500/15 border-green-500 text-green-800 dark:text-green-300",
  CANCELLED: "bg-slate-400/15 border-slate-400 text-slate-500 dark:text-slate-400",
  COMPLETED: "bg-blue-500/15 border-blue-400 text-blue-700 dark:text-blue-300",
};
const STATUS_DOT: Record<string, string> = {
  PENDING: "bg-yellow-500", CONFIRMED: "bg-green-500",
  CANCELLED: "bg-slate-400", COMPLETED: "bg-blue-500",
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled", COMPLETED: "Completed",
};

// Calendar card bg (slightly different from badge styles)
const CARD_STYLES: Record<string, string> = {
  PENDING:   "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400",
  CONFIRMED: "bg-green-50 dark:bg-green-900/20 border-green-500",
  CANCELLED: "bg-slate-100 dark:bg-slate-800/40 border-slate-400 opacity-50",
  COMPLETED: "bg-blue-50 dark:bg-blue-900/20 border-blue-400",
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

function fmtDateTime(s: string) {
  const d = new Date(s);
  return fmt(d, { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function toLocalDatetimeInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const INPUT = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500";

export default function AppointmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [view, setView] = useState<"calendar" | "list" | "checkins">("calendar");

  // Calendar
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // List view
  const [listAppts, setListAppts] = useState<Appointment[]>([]);
  const [listFilter, setListFilter] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [listLoaded, setListLoaded] = useState(false);

  // New appointment form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Side panel
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<FormState & { status: string }>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [savingReschedule, setSavingReschedule] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState("");

  // Check-ins tab state
  const [checkinAppts, setCheckinAppts] = useState<Appointment[]>([]);
  const [checkinWalkIns, setCheckinWalkIns] = useState<WalkIn[]>([]);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [convertingWalkIn, setConvertingWalkIn] = useState<WalkIn | null>(null);
  const [walkInForm, setWalkInForm] = useState({ deviceBrand: "", deviceModel: "", faultDescription: "" });
  const [convertingWalkInId, setConvertingWalkInId] = useState<string | null>(null);
  const checkinPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  useEffect(() => { if (view === "calendar") load(); }, [weekStart, view]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = (9 - START_H) * HOUR_H;
  }, []);
  useEffect(() => {
    if (view === "list" && !listLoaded) loadList();
  }, [view]);
  useEffect(() => {
    if (view === "checkins") {
      loadCheckins();
      checkinPollRef.current = setInterval(loadCheckins, 30000);
    } else {
      if (checkinPollRef.current) clearInterval(checkinPollRef.current);
    }
    return () => { if (checkinPollRef.current) clearInterval(checkinPollRef.current); };
  }, [view]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/appointments?start=${weekStart.toISOString()}&end=${weekEnd.toISOString()}`, { credentials: "include" });
    if (res.ok) setAppointments(await res.json());
    setLoading(false);
  }

  async function loadList() {
    setLoadingList(true);
    const res = await fetch("/api/appointments", { credentials: "include" });
    if (res.ok) { setListAppts(await res.json()); setListLoaded(true); }
    setLoadingList(false);
  }

  function syncAppt(updated: Appointment) {
    setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
    setListAppts(prev => prev.map(a => a.id === updated.id ? updated : a));
    if (selected?.id === updated.id) setSelected(updated);
  }

  function openDetails(appt: Appointment) {
    setSelected(appt);
    setShowForm(false);
    setEditMode(false);
    setRescheduling(false);
  }

  function openNewOnSlot(day: Date, hour: number) {
    const dt = new Date(day);
    dt.setHours(hour, 0, 0, 0);
    setForm({ ...EMPTY_FORM, scheduledAt: toLocalDatetimeInput(dt) });
    setShowForm(true);
    setSelected(null);
  }

  function openEditMode() {
    if (!selected) return;
    setEditMode(true);
    setRescheduling(false);
    setEditForm({
      customerName: selected.customerName, customerPhone: selected.customerPhone,
      deviceBrand: selected.deviceBrand, deviceModel: selected.deviceModel,
      faultDescription: selected.faultDescription,
      scheduledAt: toLocalDatetimeInput(new Date(selected.scheduledAt)),
      duration: String(selected.duration), notes: selected.notes ?? "",
      status: selected.status,
    });
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
      setListAppts(prev => [...prev, appt].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()));
      setShowForm(false); setForm(EMPTY_FORM);
      setSelected(appt); setEditMode(false);
    }
    setSaving(false);
  }

  async function saveEdit() {
    if (!selected) return;
    setSavingEdit(true);
    const res = await fetch(`/api/appointments/${selected.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ ...editForm, scheduledAt: editForm.scheduledAt ? new Date(editForm.scheduledAt).toISOString() : undefined }),
    });
    if (res.ok) { syncAppt(await res.json()); setEditMode(false); }
    setSavingEdit(false);
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ status }),
    });
    if (res.ok) syncAppt(await res.json());
  }

  async function doReschedule() {
    if (!selected || !rescheduleTime) return;
    setSavingReschedule(true);
    const res = await fetch(`/api/appointments/${selected.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ scheduledAt: new Date(rescheduleTime).toISOString() }),
    });
    if (res.ok) { syncAppt(await res.json()); setRescheduling(false); setRescheduleTime(""); }
    setSavingReschedule(false);
  }

  async function deleteAppt(id: string) {
    if (!confirm("Delete this appointment?")) return;
    const res = await fetch(`/api/appointments/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      setAppointments(prev => prev.filter(a => a.id !== id));
      setListAppts(prev => prev.filter(a => a.id !== id));
      setSelected(null);
    }
  }

  async function loadCheckins() {
    setCheckinLoading(true);
    const res = await fetch("/api/checkins", { credentials: "include" });
    if (res.ok) {
      const d = await res.json();
      setCheckinAppts(d.appointments ?? []);
      setCheckinWalkIns(d.walkIns ?? []);
    }
    setCheckinLoading(false);
  }

  async function convertWalkIn() {
    if (!convertingWalkIn) return;
    setConvertingWalkInId(convertingWalkIn.id);
    const res = await fetch("/api/checkins/convert", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ walkInId: convertingWalkIn.id, ...walkInForm }),
    });
    if (res.ok) {
      const { workOrderId } = await res.json();
      setConvertingWalkIn(null);
      setWalkInForm({ deviceBrand: "", deviceModel: "", faultDescription: "" });
      router.push(`/dashboard/workorders/${workOrderId}`);
    }
    setConvertingWalkInId(null);
  }

  async function convertToWorkOrder(appt: Appointment) {
    setConverting(true);
    setConvertError("");
    const res = await fetch("/api/workorders", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({
        customerName: appt.customerName, customerPhone: appt.customerPhone,
        deviceBrand: appt.deviceBrand, deviceModel: appt.deviceModel,
        faultDescription: appt.faultDescription,
        serviceType: "IN_STORE", faultLevel: "LOW",
      }),
    });
    if (res.ok) {
      const order = await res.json();
      await updateStatus(appt.id, "COMPLETED");
      router.push(`/dashboard/workorders/${order.id}`);
    } else {
      const err = await res.json();
      setConvertError(err.error || "Failed to create work order");
    }
    setConverting(false);
  }

  function apptStyle(appt: Appointment): React.CSSProperties {
    const start = new Date(appt.scheduledAt);
    const topPx = ((start.getHours() - START_H) * 60 + start.getMinutes()) * (HOUR_H / 60);
    const heightPx = Math.max(appt.duration * (HOUR_H / 60), 28);
    return { position: "absolute", top: topPx, height: heightPx, left: 2, right: 2, zIndex: 10 };
  }

  const panelOpen = showForm || !!selected;
  const listFiltered = listAppts
    .filter(a => listFilter ? a.status === listFilter : true)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  return (
    <div className="flex h-[calc(100vh-57px)] lg:h-screen overflow-hidden">
      {/* ── Main area ── */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${panelOpen ? "lg:mr-96" : ""}`}>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            {view === "calendar" && (
              <div className="flex items-center gap-1">
                <button onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={() => setWeekStart(getWeekStart(new Date()))}
                  className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">
                  Today
                </button>
                <button onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
            <span className="text-sm font-semibold text-slate-900 dark:text-white hidden sm:inline">
              {view === "calendar"
                ? `${fmt(weekStart, { month: "short", day: "numeric" })} – ${fmt(new Date(weekEnd.getTime() - 1), { month: "short", day: "numeric", year: "numeric" })}`
                : view === "checkins" ? "Today's Check-ins"
                : "All Appointments"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              <button onClick={() => setView("calendar")}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${view === "calendar" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
                📅 Calendar
              </button>
              <button onClick={() => setView("list")}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${view === "list" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
                ☰ List
              </button>
              <button onClick={() => setView("checkins")}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${view === "checkins" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
                ✅ Check-ins
              </button>
            </div>
            <button onClick={() => { setShowForm(true); setSelected(null); setForm(EMPTY_FORM); }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm rounded-lg font-medium transition-colors flex items-center gap-1">
              + <span className="hidden sm:inline">New Appointment</span><span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        {/* ── Calendar view ── */}
        {view === "calendar" && (
          <div className="flex-1 overflow-x-auto flex flex-col" style={{ minWidth: 0 }}>
            {/* Day headers — min-width keeps columns readable; outer div scrolls on mobile */}
            <div className="flex-shrink-0 flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" style={{ minWidth: 560 }}>
              <div className="w-14 flex-shrink-0" />
              {weekDays.map((day, i) => {
                const isToday = day.toDateString() === new Date().toDateString();
                const dayApptCount = appointments.filter(a => new Date(a.scheduledAt).toDateString() === day.toDateString() && a.status !== "CANCELLED").length;
                return (
                  <div key={i} className="flex-1 text-center py-2 border-l border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400">{fmt(day, { weekday: "short" })}</div>
                    <div className={`text-sm font-semibold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full mx-auto ${isToday ? "bg-blue-600 text-white" : "text-slate-900 dark:text-white"}`}>
                      {fmt(day, { day: "numeric" })}
                    </div>
                    {dayApptCount > 0 && (
                      <div className="text-xs text-slate-400 mt-0.5">{dayApptCount}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Scrollable grid — viewport-responsive height so it never collapses */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ height: "calc(100vh - 200px)", minHeight: 400 }}>
              <div className="flex" style={{ height: HOURS.length * HOUR_H, minWidth: 560 }}>
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
                  const dayAppts = appointments.filter(a => new Date(a.scheduledAt).toDateString() === day.toDateString());
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <div key={di} className={`flex-1 border-l border-slate-200 dark:border-slate-800 relative ${isToday ? "bg-blue-50/30 dark:bg-blue-900/5" : ""}`}>
                      {HOURS.map(h => (
                        <div key={h} style={{ height: HOUR_H }}
                          className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/20 cursor-pointer transition-colors"
                          onClick={() => openNewOnSlot(day, h)}>
                          <div className="h-1/2 border-b border-dashed border-slate-100 dark:border-slate-800/30" />
                        </div>
                      ))}

                      {/* Appointment cards */}
                      {dayAppts.map(appt => (
                        <div key={appt.id}
                          style={apptStyle(appt)}
                          onClick={e => { e.stopPropagation(); openDetails(appt); }}
                          className={`cursor-pointer rounded-md border-l-[3px] px-1.5 py-1 overflow-hidden transition-all hover:brightness-95 dark:hover:brightness-110 ${CARD_STYLES[appt.status] ?? CARD_STYLES.PENDING} ${selected?.id === appt.id ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-950" : ""}`}>
                          <p className="text-xs font-bold leading-tight truncate text-slate-800 dark:text-slate-100">
                            {fmt(new Date(appt.scheduledAt), { hour: "2-digit", minute: "2-digit" })} · {appt.customerName}
                          </p>
                          {appt.duration >= 45 && (
                            <p className="text-xs leading-tight truncate text-slate-600 dark:text-slate-300 mt-0.5">
                              {appt.deviceBrand} {appt.deviceModel}
                            </p>
                          )}
                          {appt.duration >= 75 && (
                            <p className="text-xs leading-tight truncate text-slate-500 dark:text-slate-400 mt-0.5">
                              {appt.faultDescription}
                            </p>
                          )}
                        </div>
                      ))}

                      {/* Current time line */}
                      {isToday && (() => {
                        const now = new Date();
                        const top = ((now.getHours() - START_H) * 60 + now.getMinutes()) * (HOUR_H / 60);
                        if (top < 0 || top > HOURS.length * HOUR_H) return null;
                        return (
                          <div style={{ position: "absolute", top, left: 0, right: 0, zIndex: 20 }} className="pointer-events-none">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
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
        )}

        {/* ── List view ── */}
        {view === "list" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Status filter pills */}
            <div className="flex gap-2 flex-wrap">
              {(["", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const).map(s => (
                <button key={s} onClick={() => setListFilter(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${listFilter === s
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400"}`}>
                  {s ? STATUS_LABEL[s] : "All"}
                  {s === "PENDING" && listAppts.filter(a => a.status === "PENDING").length > 0 && (
                    <span className="ml-1.5 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {listAppts.filter(a => a.status === "PENDING").length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {loadingList && (
              <div className="flex flex-col gap-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            )}

            {!loadingList && listFiltered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-3xl mb-3">📅</p>
                <p className="text-slate-500 text-sm">{listFilter ? "No appointments with this status" : "No appointments yet"}</p>
              </div>
            )}

            {/* Mobile cards */}
            {!loadingList && listFiltered.length > 0 && (
              <>
                <div className="md:hidden space-y-2">
                  {listFiltered.map(appt => (
                    <div key={appt.id}
                      onClick={() => openDetails(appt)}
                      className={`bg-white dark:bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all hover:shadow-sm border-l-4 ${selected?.id === appt.id ? "ring-2 ring-blue-500" : ""} ${CARD_STYLES[appt.status]}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{appt.customerName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{appt.deviceBrand} {appt.deviceModel}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{fmtDateTime(appt.scheduledAt)}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border flex-shrink-0 ${STATUS_STYLES[appt.status]}`}>
                          {STATUS_LABEL[appt.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Date & Time</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Customer</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Device</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 hidden lg:table-cell">Issue</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {listFiltered.map(appt => (
                        <tr key={appt.id}
                          onClick={() => openDetails(appt)}
                          className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${selected?.id === appt.id ? "bg-blue-50/40 dark:bg-blue-900/10" : ""}`}>
                          <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {fmtDateTime(appt.scheduledAt)}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{appt.customerName}</p>
                            <p className="text-xs text-slate-500">{appt.customerPhone}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {appt.deviceBrand} {appt.deviceModel}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate hidden lg:table-cell">{appt.faultDescription}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_STYLES[appt.status]}`}>
                              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${STATUS_DOT[appt.status]}`} />
                              {STATUS_LABEL[appt.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex gap-1">
                              {appt.status === "PENDING" && (
                                <button onClick={() => updateStatus(appt.id, "CONFIRMED")}
                                  className="text-xs px-2 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 rounded-md transition-colors">
                                  Confirm
                                </button>
                              )}
                              {appt.status !== "CANCELLED" && appt.status !== "COMPLETED" && (
                                <button onClick={() => updateStatus(appt.id, "CANCELLED")}
                                  className="text-xs px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 rounded-md transition-colors">
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Side panel ── */}
      {panelOpen && (
        <div className="fixed right-0 top-0 bottom-0 lg:top-auto w-full lg:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col z-40 shadow-xl">
          {/* Panel header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {showForm ? "New Appointment" : editMode ? "Edit Appointment" : "Appointment Details"}
            </h2>
            <div className="flex items-center gap-2">
              {selected && !showForm && !editMode && (
                <button onClick={openEditMode}
                  className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">
                  ✏ Edit
                </button>
              )}
              {editMode && (
                <button onClick={() => setEditMode(false)}
                  className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">
                  ← Back
                </button>
              )}
              <button onClick={() => { setShowForm(false); setSelected(null); setEditMode(false); setRescheduling(false); }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-lg leading-none transition-colors">✕</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* ── New appointment form ── */}
            {showForm && (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 mb-1 block">Customer Name *</label>
                    <input className={INPUT} value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} placeholder="Full name" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Phone *</label>
                    <input className={INPUT} value={form.customerPhone} onChange={e => setForm(p => ({ ...p, customerPhone: e.target.value }))} placeholder="+212 6XX" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Date & Time *</label>
                    <input type="datetime-local" className={INPUT} value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Brand *</label>
                    <input className={INPUT} value={form.deviceBrand} onChange={e => setForm(p => ({ ...p, deviceBrand: e.target.value }))} placeholder="Apple, Samsung…" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Model *</label>
                    <input className={INPUT} value={form.deviceModel} onChange={e => setForm(p => ({ ...p, deviceModel: e.target.value }))} placeholder="iPhone 15…" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 mb-1 block">Issue *</label>
                    <input className={INPUT} value={form.faultDescription} onChange={e => setForm(p => ({ ...p, faultDescription: e.target.value }))} placeholder="Describe the issue…" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Duration</label>
                    <select className={INPUT} value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}>
                      {[15, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Notes</label>
                    <input className={INPUT} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional" />
                  </div>
                </div>
                <button onClick={createAppointment}
                  disabled={saving || !form.customerName || !form.customerPhone || !form.deviceBrand || !form.deviceModel || !form.faultDescription || !form.scheduledAt}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors">
                  {saving ? "Creating…" : "Create Appointment"}
                </button>
              </div>
            )}

            {/* ── Details view ── */}
            {selected && !showForm && !editMode && (
              <div className="p-4 space-y-4">
                {/* Status + date/time */}
                <div className="space-y-2">
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${STATUS_STYLES[selected.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[selected.status]}`} />
                    {STATUS_LABEL[selected.status]}
                  </span>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-900 dark:text-white font-semibold">
                      <span>📅</span>
                      <span>{fmtDateTime(selected.scheduledAt)}</span>
                    </div>
                    <div className="text-xs text-slate-500">{selected.duration} min appointment</div>
                  </div>
                </div>

                {/* Customer & device */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">👤</span>
                    <span className="font-medium text-slate-900 dark:text-white">{selected.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">📞</span>
                    <span className="text-slate-600 dark:text-slate-300">{selected.customerPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">📱</span>
                    <span className="text-slate-700 dark:text-slate-200">{selected.deviceBrand} {selected.deviceModel}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-slate-400 mt-0.5">🔧</span>
                    <span className="text-slate-600 dark:text-slate-300">{selected.faultDescription}</span>
                  </div>
                  {selected.notes && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-slate-400 mt-0.5">📝</span>
                      <span className="text-slate-500 dark:text-slate-400 italic">{selected.notes}</span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                {selected.status !== "CANCELLED" && selected.status !== "COMPLETED" && (
                  <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</p>

                    <div className="flex gap-2 flex-wrap">
                      {selected.status === "PENDING" && (
                        <button onClick={() => updateStatus(selected.id, "CONFIRMED")}
                          className="flex-1 py-2 text-xs font-semibold bg-green-600/15 hover:bg-green-600/25 text-green-700 dark:text-green-400 border border-green-500/30 rounded-lg transition-colors">
                          ✓ Confirm
                        </button>
                      )}
                      <button onClick={() => { setRescheduling(v => !v); setRescheduleTime(toLocalDatetimeInput(new Date(selected.scheduledAt))); }}
                        className="flex-1 py-2 text-xs font-semibold bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 dark:text-blue-400 border border-blue-500/30 rounded-lg transition-colors">
                        ⏰ Reschedule
                      </button>
                      <button onClick={() => updateStatus(selected.id, "CANCELLED")}
                        className="flex-1 py-2 text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-400/30 rounded-lg transition-colors">
                        ✕ Cancel
                      </button>
                    </div>

                    {/* Reschedule inline picker */}
                    {rescheduling && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-3 space-y-2">
                        <label className="text-xs text-blue-700 dark:text-blue-300 font-medium">New date & time</label>
                        <input type="datetime-local" className={INPUT} value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} />
                        <div className="flex gap-2">
                          <button onClick={doReschedule} disabled={savingReschedule || !rescheduleTime}
                            className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg font-medium transition-colors">
                            {savingReschedule ? "Saving…" : "Confirm Reschedule"}
                          </button>
                          <button onClick={() => setRescheduling(false)}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* WhatsApp confirmation */}
                    {selected.customerPhone && (() => {
                      const d = new Date(selected.scheduledAt);
                      const msg = fillTemplate(DEFAULT_TEMPLATES.appointment, {
                        customerName: selected.customerName,
                        date: d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }),
                        time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
                        deviceBrand: selected.deviceBrand,
                        deviceModel: selected.deviceModel,
                        shopName: user?.name ?? "FixFlow",
                      });
                      return (
                        <a href={buildWaUrl(selected.customerPhone, msg)} target="_blank" rel="noopener noreferrer"
                          className="w-full py-2 flex items-center justify-center gap-2 text-xs font-semibold bg-green-600/15 hover:bg-green-600/25 text-green-700 dark:text-green-400 border border-green-500/30 rounded-lg transition-colors">
                          💬 Send WhatsApp Confirmation
                        </a>
                      );
                    })()}

                    {/* Convert to work order */}
                    {convertError && (
                      <p className="text-xs text-red-500 dark:text-red-400 text-center">{convertError}</p>
                    )}
                    <button onClick={() => convertToWorkOrder(selected)} disabled={converting}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                      {converting
                        ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Creating…</>
                        : <><span>📋</span> Convert to Work Order</>}
                    </button>
                  </div>
                )}

                {/* Footer */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    Booked {fmt(new Date(selected.createdAt), { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <button onClick={() => deleteAppt(selected.id)}
                    className="text-xs text-red-500 hover:text-red-400 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            )}

            {/* ── Edit mode ── */}
            {selected && editMode && (
              <div className="p-4 space-y-3">
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
                    <label className="text-xs text-slate-500 mb-1 block">Duration</label>
                    <select className={INPUT} value={editForm.duration ?? "60"} onChange={e => setEditForm(p => ({ ...p, duration: e.target.value }))}>
                      {[15, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Status</label>
                    <select className={INPUT} value={editForm.status ?? selected.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
                      {["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 mb-1 block">Notes</label>
                    <input className={INPUT} value={editForm.notes ?? ""} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional" />
                  </div>
                </div>
                <button onClick={saveEdit} disabled={savingEdit}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {savingEdit ? "Saving…" : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      {panelOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => { setShowForm(false); setSelected(null); setEditMode(false); setRescheduling(false); }} />
      )}

      {/* ── Check-ins view ── */}
      {view === "checkins" && (
        <div className="absolute inset-0 top-[57px] lg:top-auto lg:relative overflow-y-auto p-4 space-y-4 bg-white dark:bg-slate-950">
          {/* Header bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-slate-500 dark:text-slate-400">Live · refreshes every 30s</span>
              {checkinLoading && <span className="text-xs text-slate-400">updating…</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={loadCheckins}
                className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">
                ↻ Refresh
              </button>
              <button onClick={() => setShowQR(true)}
                className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                📲 QR Code
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Appointments", count: checkinAppts.length, color: "text-blue-600 dark:text-blue-400" },
              { label: "Walk-ins", count: checkinWalkIns.length, color: "text-purple-600 dark:text-purple-400" },
              { label: "Total", count: checkinAppts.length + checkinWalkIns.length, color: "text-slate-900 dark:text-white" },
            ].map(({ label, count, color }) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
                <p className={`text-2xl font-bold ${color}`}>{count}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Appointment check-ins */}
          {checkinAppts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Appointments Checked In</p>
              <div className="space-y-2">
                {checkinAppts.map(appt => (
                  <div key={appt.id} className="bg-white dark:bg-slate-900 border border-green-200 dark:border-green-800/40 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0 text-sm">✅</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{appt.customerName}</p>
                      <p className="text-xs text-slate-500">{appt.deviceBrand} {appt.deviceModel} · {appt.customerPhone}</p>
                      {appt.checkedInAt && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                          Checked in {new Date(appt.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {" · "}Appt {new Date(appt.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                    <button onClick={() => convertToWorkOrder(appt)} disabled={converting}
                      className="flex-shrink-0 text-xs px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-colors whitespace-nowrap">
                      → WO
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Walk-in check-ins */}
          {checkinWalkIns.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Walk-ins</p>
              <div className="space-y-2">
                {checkinWalkIns.map(w => (
                  <div key={w.id} className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/40 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0 text-sm">👋</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{w.customerName}</p>
                      <p className="text-xs text-slate-500">{w.customerPhone}</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                        {w.workOrderId ? "✓ Work order created" : `Arrived ${new Date(w.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                      </p>
                    </div>
                    {!w.workOrderId
                      ? <button onClick={() => { setConvertingWalkIn(w); setWalkInForm({ deviceBrand: "", deviceModel: "", faultDescription: "" }); }}
                          className="flex-shrink-0 text-xs px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors whitespace-nowrap">
                          → WO
                        </button>
                      : <button onClick={() => router.push(`/dashboard/workorders/${w.workOrderId}`)}
                          className="flex-shrink-0 text-xs px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors whitespace-nowrap">
                          View WO
                        </button>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {!checkinLoading && checkinAppts.length === 0 && checkinWalkIns.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🚪</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No check-ins today yet</p>
              <p className="text-slate-400 text-xs mt-1">Share the QR code with customers to start receiving check-ins</p>
              <button onClick={() => setShowQR(true)}
                className="mt-4 px-4 py-2 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                📲 Show QR Code
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── QR Code modal ── */}
      {showQR && user?.shopId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Customer Check-in QR</h3>
              <button onClick={() => setShowQR(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-lg leading-none">✕</button>
            </div>
            <div className="bg-white p-4 rounded-xl flex items-center justify-center mb-4">
              <QRCode value={`${typeof window !== "undefined" ? window.location.origin : ""}/checkin/${user.shopId}`} size={200} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center break-all mb-3">
              {typeof window !== "undefined" ? window.location.origin : ""}/checkin/{user.shopId}
            </p>
            <button
              onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/checkin/${user.shopId}`)}
              className="w-full py-2 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors">
              📋 Copy Link
            </button>
          </div>
        </div>
      )}

      {/* ── Walk-in → Work Order modal ── */}
      {convertingWalkIn && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setConvertingWalkIn(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Create Work Order</h3>
              <button onClick={() => setConvertingWalkIn(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-lg leading-none">✕</button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-4">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{convertingWalkIn.customerName}</p>
              <p className="text-xs text-slate-500">{convertingWalkIn.customerPhone}</p>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Device Brand</label>
                <input className={INPUT} value={walkInForm.deviceBrand} onChange={e => setWalkInForm(p => ({ ...p, deviceBrand: e.target.value }))} placeholder="Apple, Samsung…" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Device Model</label>
                <input className={INPUT} value={walkInForm.deviceModel} onChange={e => setWalkInForm(p => ({ ...p, deviceModel: e.target.value }))} placeholder="iPhone 15…" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Issue</label>
                <input className={INPUT} value={walkInForm.faultDescription} onChange={e => setWalkInForm(p => ({ ...p, faultDescription: e.target.value }))} placeholder="Describe the issue…" />
              </div>
            </div>
            <button onClick={convertWalkIn} disabled={!!convertingWalkInId}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
              {convertingWalkInId ? "Creating…" : "📋 Create Work Order"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
