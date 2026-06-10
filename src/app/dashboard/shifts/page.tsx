"use client";
import { useEffect, useState, useCallback } from "react";

interface Shift {
  id: string;
  startTime: string;
  endTime: string | null;
  notes: string | null;
  user: { id: string; name: string; role: string };
  shop: { id: string; name: string } | null;
}

function duration(start: string, end: string | null): string {
  if (!end) return "Active";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function fmt(dt: string) {
  return new Date(dt).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/shifts", { credentials: "include" });
      const data = await res.json();
      setShifts(Array.isArray(data) ? data : []);
    } catch { setError("Failed to load shifts"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeShift = shifts.find((s) => !s.endTime) ?? null;

  async function clockIn() {
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/shifts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ notes: notes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setNotes(""); await load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSubmitting(false); }
  }

  async function clockOut(id: string) {
    setError("");
    try {
      const res = await fetch(`/api/shifts/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({}),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error ?? "Error"); }
      await load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Shifts</h1>
        <p className="text-sm text-slate-400 mt-1">Track work hours</p>
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        {activeShift ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="font-semibold text-slate-900 dark:text-slate-100">Active Shift</span>
            </div>
            <p className="text-sm text-slate-500">{`Started at ${fmt(activeShift.startTime)} — ${duration(activeShift.startTime, null)}`}</p>
            <button onClick={() => clockOut(activeShift.id)} className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition">Clock Out</button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-500">No active shift</p>
            <input type="text" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={clockIn} disabled={submitting} className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50">
              {submitting ? "Clocking in..." : "Clock In"}
            </button>
          </div>
        )}
        {error && <p className="text-red-600 dark:text-red-400 text-sm mt-2">{error}</p>}
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800"><h2 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">History</h2></div>
        {loading ? <p className="px-6 py-4 text-sm text-slate-400">Loading...</p> : shifts.length === 0 ? <p className="px-6 py-4 text-sm text-slate-400">No shifts yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Employee</th>
                  <th className="px-6 py-3 text-left">Start</th>
                  <th className="px-6 py-3 text-left">End</th>
                  <th className="px-6 py-3 text-left">Duration</th>
                  <th className="px-6 py-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {shifts.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-200">{s.user.name}</td>
                    <td className="px-6 py-3 text-slate-500">{fmt(s.startTime)}</td>
                    <td className="px-6 py-3">{s.endTime ? <span className="text-slate-500">{fmt(s.endTime)}</span> : <span className="text-green-600 dark:text-green-400 font-medium text-xs">Active</span>}</td>
                    <td className="px-6 py-3 text-slate-500">{duration(s.startTime, s.endTime)}</td>
                    <td className="px-6 py-3 text-slate-500 max-w-[160px] truncate">{s.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
