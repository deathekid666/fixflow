"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";

type Branch = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  managerId: string | null;
  isActive: boolean;
  createdAt: string;
  manager: { id: string; name: string } | null;
  _count: { users: number; workOrders: number; spareParts: number };
};

type Engineer = { id: string; name: string; branchId: string | null };

const INPUT = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500";

export default function BranchesPage() {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: "", address: "", phone: "", managerId: "" });
  const [editForm, setEditForm] = useState({ name: "", address: "", phone: "", managerId: "", isActive: true });

  function flash(text: string, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  }

  async function load() {
    setLoading(true);
    try {
      const [bRes, eRes] = await Promise.all([
        fetch("/api/branches", { credentials: "include" }),
        fetch("/api/users", { credentials: "include" }),
      ]);
      if (bRes.ok) setBranches(await bRes.json());
      if (eRes.ok) setEngineers(await eRes.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function addBranch(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, managerId: form.managerId || null }),
      });
      if (!res.ok) { flash((await res.json()).error ?? "Error", false); return; }
      setForm({ name: "", address: "", phone: "", managerId: "" });
      setShowAdd(false);
      flash("Branch created");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function saveBranch(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/branches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...editForm, managerId: editForm.managerId || null }),
      });
      if (!res.ok) { flash((await res.json()).error ?? "Error", false); return; }
      setEditId(null);
      flash("Branch updated");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function deleteBranch(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/branches/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) { flash((await res.json()).error ?? "Error", false); return; }
      setDeleteConfirm(null);
      flash("Branch deleted");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function assignEngineer(branchId: string, userId: string, remove: boolean) {
    const res = await fetch(`/api/branches/${branchId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId, remove }),
    });
    if (res.ok) { flash(remove ? "Engineer unassigned" : "Engineer assigned"); load(); }
    else flash((await res.json()).error ?? "Error", false);
  }

  const isAdmin = user?.role === "ADMIN";
  const activeBranches = branches.filter(b => b.isActive).length;
  const totalOrders = branches.reduce((s, b) => s + b._count.workOrders, 0);
  const totalStaff = branches.reduce((s, b) => s + b._count.users, 0);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Branches"
        subtitle="Manage multiple locations under one shop"
        actions={isAdmin ? (
          <button onClick={() => setShowAdd(v => !v)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            + Add Branch
          </button>
        ) : undefined}
      />

      {msg && (
        <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm font-medium ${msg.ok ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}`}>
          {msg.text}
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Branches", value: branches.length },
          { label: "Active", value: activeBranches },
          { label: "Total Staff", value: totalStaff },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={addBranch} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 mb-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">New Branch</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Branch Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Downtown" className={INPUT} required />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 555 0000" className={INPUT} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Address</label>
              <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="123 Main St" className={INPUT} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Branch Manager</label>
              <select value={form.managerId} onChange={e => setForm(p => ({ ...p, managerId: e.target.value }))} className={INPUT}>
                <option value="">— None —</option>
                {engineers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg">
              {saving ? "Creating…" : "Create Branch"}
            </button>
          </div>
        </form>
      )}

      {/* Branch list */}
      {loading ? (
        <div className="text-center text-sm text-slate-400 py-12">Loading…</div>
      ) : branches.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-3">🏢</div>
          <p className="text-sm font-medium">No branches yet</p>
          <p className="text-xs mt-1">Create your first branch to manage multiple locations</p>
        </div>
      ) : (
        <div className="space-y-4">
          {branches.map(branch => (
            <div key={branch.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Branch header */}
              <div className="flex items-start justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${branch.isActive ? "bg-green-500" : "bg-slate-400"}`} />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">{branch.name}</div>
                    {branch.address && <div className="text-xs text-slate-500 truncate mt-0.5">{branch.address}</div>}
                    {branch.phone && <div className="text-xs text-slate-500">{branch.phone}</div>}
                    {branch.manager && <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Manager: {branch.manager.name}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                  {isAdmin && (
                    <>
                      <button onClick={() => { setEditId(branch.id); setEditForm({ name: branch.name, address: branch.address ?? "", phone: branch.phone ?? "", managerId: branch.managerId ?? "", isActive: branch.isActive }); }}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
                        Edit
                      </button>
                      <button onClick={() => setDeleteConfirm(branch.id)}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30">
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
                {[
                  { label: "Staff", value: branch._count.users },
                  { label: "Work Orders", value: branch._count.workOrders },
                  { label: "Parts", value: branch._count.spareParts },
                ].map(s => (
                  <div key={s.label} className="p-3 text-center">
                    <div className="text-lg font-bold text-slate-900 dark:text-white">{s.value}</div>
                    <div className="text-xs text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Edit form */}
              {editId === branch.id && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Edit Branch</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Name *</label>
                      <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className={INPUT} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Phone</label>
                      <input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className={INPUT} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-slate-500 mb-1">Address</label>
                      <input value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} className={INPUT} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Manager</label>
                      <select value={editForm.managerId} onChange={e => setEditForm(p => ({ ...p, managerId: e.target.value }))} className={INPUT}>
                        <option value="">— None —</option>
                        {engineers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <input type="checkbox" id={`active-${branch.id}`} checked={editForm.isActive} onChange={e => setEditForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded" />
                      <label htmlFor={`active-${branch.id}`} className="text-sm text-slate-700 dark:text-slate-300">Active</label>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditId(null)} className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Cancel</button>
                    <button onClick={() => saveBranch(branch.id)} disabled={saving} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg">
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              )}

              {/* Assign engineers */}
              {isAdmin && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Assign Engineers</h4>
                  <div className="flex flex-wrap gap-2">
                    {engineers.map(eng => {
                      const assigned = eng.branchId === branch.id;
                      return (
                        <button key={eng.id}
                          onClick={() => assignEngineer(branch.id, eng.id, assigned)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            assigned
                              ? "bg-blue-600/10 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                              : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}>
                          {assigned ? "✓ " : ""}{eng.name}
                        </button>
                      );
                    })}
                    {engineers.length === 0 && <span className="text-xs text-slate-400">No engineers found</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Delete Branch?</h3>
            <p className="text-sm text-slate-500 mb-5">Work orders, engineers, and parts linked to this branch will be unassigned but not deleted.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Cancel</button>
              <button onClick={() => deleteBranch(deleteConfirm)} disabled={saving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg">
                {saving ? "Deleting…" : "Delete Branch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
