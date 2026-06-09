"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

type Expense = {
  id: string; title: string; amount: number; category: string;
  note: string | null; date: string; createdAt: string;
  user: { name: string };
};

const CATEGORIES = ["RENT", "UTILITIES", "PARTS_PURCHASE", "SALARY", "MARKETING", "EQUIPMENT", "OTHER"];
const CATEGORY_COLORS: Record<string, string> = {
  RENT: "bg-blue-500/20 text-blue-400",
  UTILITIES: "bg-yellow-500/20 text-yellow-400",
  PARTS_PURCHASE: "bg-orange-500/20 text-orange-400",
  SALARY: "bg-purple-500/20 text-purple-400",
  MARKETING: "bg-pink-500/20 text-pink-400",
  EQUIPMENT: "bg-cyan-500/20 text-cyan-400",
  OTHER: "bg-slate-500/20 text-slate-400",
};

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", amount: "", category: "OTHER", note: "", date: new Date().toISOString().split("T")[0] });
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, [categoryFilter]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryFilter) params.set("category", categoryFilter);
    const res = await fetch(`/api/expenses?${params}`, { credentials: "include" });
    const data = await res.json();
    setExpenses(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.title || !form.amount) return;
    setSaving(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ title: "", amount: "", category: "OTHER", note: "", date: new Date().toISOString().split("T")[0] });
      setShowForm(false);
      await load();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    await fetch("/api/expenses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id }),
    });
    await load();
  }

  const filtered = search.trim()
    ? expenses.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.note ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : expenses;

  function exportCSV() {
    const rows = [
      ["Date", "Title", "Category", "Amount", "Note", "Added By"],
      ...expenses.map(e => [
        new Date(e.date).toLocaleDateString(),
        e.title,
        e.category,
        e.amount.toFixed(2),
        e.note ?? "",
        e.user.name,
      ].map(v => `"${String(v).replace(/"/g, '""')}"`)),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = CATEGORIES.map(c => ({
    cat: c,
    total: expenses.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Expenses</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track your shop expenses</p>
        </div>
        <div className="flex items-center gap-2">
          {expenses.length > 0 && (
            <button onClick={exportCSV}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors font-medium">
              ⬇ Export CSV
            </button>
          )}
          {user?.role === "ADMIN" && (
            <button onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors font-medium">
              + Add Expense
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 col-span-2">
          <p className="text-xs text-slate-500 mb-1">Total Expenses</p>
          <p className="text-3xl font-bold text-red-400">{totalExpenses.toFixed(2)} MAD</p>
          <p className="text-xs text-slate-600 mt-1">{expenses.length} entries</p>
        </div>
        {byCategory.slice(0, 2).map(c => (
          <div key={c.cat} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{c.cat.replace("_", " ")}</p>
            <p className="text-xl font-bold text-white">{c.total.toFixed(0)}</p>
            <p className="text-xs text-slate-600">MAD</p>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300">New Expense</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Monthly rent, Electricity bill"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Amount (MAD) *</label>
              <input type="number" min="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Note</label>
              <input value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                placeholder="Optional note"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg">
              {saving ? "Saving..." : "Save Expense"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-sm rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or note..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setCategoryFilter("")}
          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${!categoryFilter ? "bg-blue-600 text-white border-blue-600" : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600"}`}>
          All
        </button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategoryFilter(c)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${categoryFilter === c ? "bg-blue-600 text-white border-blue-600" : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600"}`}>
            {c.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              {["Date", "Title", "Category", "Amount", "Note", "By", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && [...Array(6)].map((_, i) => (
              <tr key={i} className="border-b border-slate-800/50 animate-pulse">
                <td className="px-4 py-3.5"><div className="h-3 w-16 bg-slate-800 rounded" /></td>
                <td className="px-4 py-3.5"><div className={`h-3 bg-slate-700 rounded ${["w-32","w-28","w-36","w-24","w-32","w-28"][i]}`} /></td>
                <td className="px-4 py-3.5"><div className="h-5 w-20 bg-slate-800 rounded-full" /></td>
                <td className="px-4 py-3.5"><div className={`h-3 bg-slate-800 rounded ${["w-16","w-20","w-14","w-18","w-16","w-20"][i]}`} /></td>
                <td className="px-4 py-3.5"><div className={`h-3 bg-slate-800 rounded ${["w-24","w-16","w-28","w-20","w-0","w-24"][i]}`} /></td>
                <td className="px-4 py-3.5"><div className="h-3 w-16 bg-slate-800 rounded" /></td>
                <td className="px-4 py-3.5" />
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center">
                <p className="text-4xl mb-3">💸</p>
                <p className="text-slate-400 font-medium">{search ? "No matching expenses" : "No expenses yet"}</p>
                <p className="text-slate-600 text-sm mt-1">{search ? "Try a different search term" : "Add your first expense to start tracking"}</p>
              </td></tr>
            )}
            {filtered.map(e => (
              <tr key={e.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(e.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-white font-medium">{e.title}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[e.category] ?? CATEGORY_COLORS.OTHER}`}>
                    {e.category.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-red-400 font-medium">{e.amount.toFixed(2)} MAD</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{e.note || "—"}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{e.user.name}</td>
                <td className="px-4 py-3">
                  {user?.role === "ADMIN" && (
                    <button onClick={() => handleDelete(e.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}