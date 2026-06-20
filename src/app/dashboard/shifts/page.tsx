"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface ShiftUser {
  id: string;
  name: string;
  role: string;
}

interface Shift {
  id: string;
  startTime: string;
  endTime: string | null;
  notes: string | null;
  user: ShiftUser;
  shop: { id: string; name: string } | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function durationMs(start: string, end: string | null): number {
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  return Math.max(0, e - s);
}

function fmtDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function fmtDateTime(dt: string): string {
  return new Date(dt).toLocaleString([], {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtTime(dt: string): string {
  return new Date(dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function weekStart(): Date {
  const now = new Date();
  const d = new Date(now);
  d.setDate(now.getDate() - now.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ShiftsPage() {
  const { t } = useLanguage();
  const { user: me } = useAuth();
  const isAdmin = me?.role === "ADMIN" || me?.role === "SUPER_ADMIN";

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(new Date());

  // Live clock for active shift duration
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/shifts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setShifts(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load shifts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeShift = shifts.find((s) => !s.endTime && s.user.id === me?.id) ?? null;

  async function clockIn() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notes: notes.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Clock-in failed");
      setNotes("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  async function clockOut(id: string) {
    setError("");
    try {
      const res = await fetch(`/api/shifts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Clock-out failed");
      }
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  // ── Weekly hours per engineer ───────────────────────────────────────────────

  const ws = weekStart();
  const weekShifts = shifts.filter((s) => new Date(s.startTime) >= ws);

  const weekByUser: Record<string, { name: string; ms: number; shifts: number }> = {};
  for (const s of weekShifts) {
    if (!weekByUser[s.user.id]) {
      weekByUser[s.user.id] = { name: s.user.name, ms: 0, shifts: 0 };
    }
    weekByUser[s.user.id].ms += durationMs(s.startTime, s.endTime);
    weekByUser[s.user.id].shifts++;
  }

  const weekRows = Object.entries(weekByUser).sort((a, b) => b[1].ms - a[1].ms);

  // Active shift live duration
  const activeDuration = activeShift
    ? fmtDuration(now.getTime() - new Date(activeShift.startTime).getTime())
    : null;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("shifts")}</h1>
        <p className="text-sm text-slate-400 mt-1">
          {isAdmin ? t("shiftsSubtitle") : t("shiftsSubtitleOwn")}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Clock In / Out Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        {activeShift ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{t("currentlyWorking")}</p>
                <p className="text-sm text-slate-500">
                  Since {fmtDateTime(activeShift.startTime)} · <span className="text-green-600 dark:text-green-400 font-medium">{activeDuration}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => clockOut(activeShift.id)}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-semibold rounded-lg transition"
            >
              {t("clockOut")}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0" />
              <p className="font-medium text-slate-500 dark:text-slate-400">{t("notClockedIn")}</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <input
                type="text"
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !submitting && clockIn()}
                className="flex-1 min-w-48 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={clockIn}
                disabled={submitting}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
              >
                {submitting ? t("clockingIn") : t("clockIn")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Weekly Summary */}
      {weekRows.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              {t("thisWeek")}
              <span className="ml-2 text-xs text-slate-400 font-normal">
                (from {ws.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })})
              </span>
            </h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {weekRows.map(([uid, row]) => {
              const pct = Math.min(100, (row.ms / (40 * 3_600_000)) * 100);
              return (
                <div key={uid} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{row.name}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {fmtDuration(row.ms)}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">
                        {row.shifts} shift{row.shifts !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shift History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{t("shiftsHistory")}</h2>
          {!loading && shifts.length > 0 && (
            <span className="text-xs text-slate-400">{shifts.length} {t("shiftsTotal")}</span>
          )}
        </div>

        {loading ? (
          <div className="animate-pulse divide-y divide-slate-100 dark:divide-slate-800">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="px-6 py-4 flex gap-6">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-28" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-36" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-36" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-14" />
              </div>
            ))}
          </div>
        ) : shifts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-3xl mb-3">🕐</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("noShiftsYet")}</p>
            <p className="text-xs text-slate-400 mt-1">{t("clockInToStart")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                <tr>
                  {isAdmin && <th className="px-6 py-3 text-left">{t("engineerHeader")}</th>}
                  <th className="px-6 py-3 text-left">{t("clockInHeader")}</th>
                  <th className="px-6 py-3 text-left">{t("clockOutHeader")}</th>
                  <th className="px-6 py-3 text-left">{t("durationHeader")}</th>
                  <th className="px-6 py-3 text-left">{t("notesHeader")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {shifts.map((s) => {
                  const isActive = !s.endTime;
                  const ms = durationMs(s.startTime, s.endTime);
                  return (
                    <tr
                      key={s.id}
                      className={`transition ${isActive ? "bg-green-50/50 dark:bg-green-950/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/40"}`}
                    >
                      {isAdmin && (
                        <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {s.user.name}
                        </td>
                      )}
                      <td className="px-6 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {fmtDateTime(s.startTime)}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        {s.endTime ? (
                          <span className="text-slate-600 dark:text-slate-400">{fmtTime(s.endTime)}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            {t("activeStatus")}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">
                        {isActive ? (
                          <span className="text-green-600 dark:text-green-400">
                            {fmtDuration(now.getTime() - new Date(s.startTime).getTime())}
                          </span>
                        ) : (
                          fmtDuration(ms)
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-500 dark:text-slate-400 max-w-[180px] truncate">
                        {s.notes ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
