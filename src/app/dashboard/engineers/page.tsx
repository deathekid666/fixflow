"use client";

import { useEffect, useState } from "react";

type Engineer = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Stats = {
  total: number;
  completed: number;
  delivered: number;
  cancelled: number;
  bounces: number;
  revenue: number;
  avgTat: number;
};

type EngineerWithStats = Engineer & { stats: Stats };

export default function EngineersPage() {
  const [engineers, setEngineers] = useState<EngineerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [usersRes, ordersRes] = await Promise.all([
        fetch("/api/users", { credentials: "include" }),
        fetch("/api/workorders", { credentials: "include" }),
      ]);
      const users: Engineer[] = await usersRes.json();
      const orders = await ordersRes.json();

      const withStats: EngineerWithStats[] = users.map((u) => {
        const mine = Array.isArray(orders) ? orders.filter((o: any) => o.assignee?.id === u.id || o.creator?.id === u.id) : [];
        const delivered = mine.filter((o: any) => o.status === "DELIVERED");
        const bounces = mine.filter((o: any) => o.isBounce);
        const revenue = delivered.reduce((s: number, o: any) => s + (o.total ?? 0), 0);
        const tats = mine.filter((o: any) => o.tatDays != null).map((o: any) => o.tatDays);
        const avgTat = tats.length > 0 ? Math.round(tats.reduce((a: number, b: number) => a + b, 0) / tats.length) : 0;

        return {
          ...u,
          stats: {
            total: mine.length,
            completed: mine.filter((o: any) => ["DONE", "DELIVERED"].includes(o.status)).length,
            delivered: delivered.length,
            cancelled: mine.filter((o: any) => o.status === "CANCELLED").length,
            bounces: bounces.length,
            revenue,
            avgTat,
          },
        };
      });

      setEngineers(withStats);
    } catch {
      setError("Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setError("");
    if (!form.name || !form.email || !form.password) { setError("All fields are required"); return; }
    setSaving(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...form, role: "ENGINEER" }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed"); setSaving(false); return; }
    setForm({ name: "", email: "", password: "" });
    setShowForm(false);
    await load();
    setSaving(false);
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Engineers</h1>
          <p className="text-sm text-slate-500 mt-0.5">Team performance overview</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors font-medium">
          + Add Engineer
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300">New Engineer</h2>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Name", field: "name", placeholder: "Full name" },
              { label: "Email", field: "email", placeholder: "email@example.com" },
              { label: "Password", field: "password", placeholder: "Temporary password", type: "password" },
            ].map((f) => (
              <div key={f.field}>
                <label className="text-xs text-slate-400 mb-1 block">{f.label}</label>
                <input
                  type={f.type || "text"}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder={f.placeholder}
                  value={(form as any)[f.field]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.field]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors">
              {saving ? "Saving..." : "Add Engineer"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : engineers.length === 0 ? (
        <p className="text-slate-400 text-sm">No engineers yet.</p>
      ) : (
        <div className="space-y-4">
          {engineers.map((e) => (
            <div key={e.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              {/* Engineer header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">{e.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      e.role === "ADMIN"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}>{e.role}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{e.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Total Revenue</p>
                  <p className="text-lg font-bold text-emerald-400">{e.stats.revenue.toFixed(0)} MAD</p>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { label: "Assigned", value: e.stats.total, color: "text-white" },
                  { label: "Completed", value: e.stats.completed, color: "text-green-400" },
                  { label: "Delivered", value: e.stats.delivered, color: "text-slate-300" },
                  { label: "Cancelled", value: e.stats.cancelled, color: e.stats.cancelled > 0 ? "text-red-400" : "text-slate-500" },
                  { label: "Bounces", value: e.stats.bounces, color: e.stats.bounces > 0 ? "text-orange-400" : "text-slate-500" },
                  { label: "Avg TAT", value: `${e.stats.avgTat}d`, color: e.stats.avgTat > 3 ? "text-orange-400" : "text-blue-400" },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-800 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Performance bar */}
              {e.stats.total > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Completion rate</span>
                    <span>{Math.round((e.stats.completed / e.stats.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-green-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.round((e.stats.completed / e.stats.total) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}