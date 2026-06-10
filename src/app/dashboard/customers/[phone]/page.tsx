"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

type Note = {
  id: string; message: string; createdAt: string;
  user: { name: string };
};

type WorkOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deviceBrand: string;
  deviceModel: string;
  serialNumber: string;
  status: string;
  total: number;
  collected: number;
  createdAt: string;
  doneAt: string | null;
  isBounce: boolean;
  bounceCount: number;
  assignee: { name: string } | null;
  _count: { parts: number };
};

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  DIAGNOSING: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  REPAIRING: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
  DONE: "bg-green-500/20 text-green-600 dark:text-green-400",
  DELIVERED: "bg-slate-500/20 text-slate-500",
  CANCELLED: "bg-red-500/20 text-red-600 dark:text-red-400",
};

export default function CustomerDetailPage({ params }: { params: { phone: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const phone = decodeURIComponent(params.phone);
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`/api/customers/history?phone=${encodeURIComponent(phone)}`)
      .then(r => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
    loadNotes();
  }, []);

  async function loadNotes() {
    const res = await fetch(`/api/customers/notes?phone=${encodeURIComponent(phone)}`, { credentials: "include" });
    if (res.ok) setNotes(await res.json());
  }

  async function addNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    const res = await fetch("/api/customers/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ phone, message: noteText }),
    });
    if (res.ok) {
      setNoteText("");
      await loadNotes();
    }
    setSavingNote(false);
  }

  async function deleteNote(id: string) {
    await fetch("/api/customers/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id }),
    });
    await loadNotes();
  }

  const totalSpent = orders.reduce((s, o) => s + o.total, 0);
  const totalCollected = orders.reduce((s, o) => s + o.collected, 0);
  const customer = orders[0];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm">← Back</button>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{loading ? "Loading..." : customer?.customerName ?? phone}</h1>
        {orders.length > 1 && <span className="text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">Repeat Customer</span>}
      </div>

      {!loading && customer && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer Info</h2>
            <div className="space-y-2 text-sm">
              <div><p className="text-xs text-slate-500">Phone</p><p className="text-slate-900 dark:text-white">{phone}</p></div>
              <div><p className="text-xs text-slate-500">Email</p><p className="text-slate-900 dark:text-white">{customer.customerEmail || "—"}</p></div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Summary</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-slate-500">Total Orders</p><p className="text-slate-900 dark:text-white text-xl font-semibold">{orders.length}</p></div>
              <div><p className="text-xs text-slate-500">Total Spent</p><p className="text-slate-900 dark:text-white text-xl font-semibold">{totalSpent.toFixed(2)}</p></div>
              <div><p className="text-xs text-slate-500">Collected</p><p className="text-green-600 dark:text-green-400 font-semibold">{totalCollected.toFixed(2)}</p></div>
              <div><p className="text-xs text-slate-500">Outstanding</p><p className="text-red-600 dark:text-red-400 font-semibold">{(totalSpent - totalCollected).toFixed(2)}</p></div>
            </div>
          </div>
        </div>
      )}

      {/* Team Notes */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Team Notes</h2>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">Internal only</span>
        </div>

        {/* Add note */}
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote(); }}
            placeholder="Add a note about this customer... (Ctrl+Enter to save)"
            rows={3}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
          />
          <div className="flex justify-end">
            <button onClick={addNote} disabled={savingNote || !noteText.trim()}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors">
              {savingNote ? "Saving..." : "Add Note"}
            </button>
          </div>
        </div>

        {/* Notes list */}
        {notes.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3">No notes yet. Add one above.</p>
        ) : (
          <div className="space-y-2">
            {notes.map(n => (
              <div key={n.id} className="group flex items-start gap-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg px-3 py-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                  {n.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{n.user.name}</span>
                    <span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">{n.message}</p>
                </div>
                {(user?.role === "ADMIN") && (
                  <button onClick={() => deleteNote(n.id)}
                    className="opacity-0 group-hover:opacity-100 text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all flex-shrink-0 mt-0.5">
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Repair History</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              {["Device", "SN", "Status", "Parts", "Total", "Date", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>}
            {!loading && orders.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No orders found.</td></tr>}
            {orders.map(o => (
              <tr key={o.id} className="border-b border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="text-slate-900 dark:text-white">{o.deviceBrand} {o.deviceModel}</div>
                  {o.isBounce && <span className="text-xs text-red-600 dark:text-red-400">⚠️ Bounce ×{o.bounceCount}</span>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{o.serialNumber || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{o._count.parts}</td>
                <td className="px-4 py-3 text-slate-900 dark:text-white">{o.total.toFixed(2)}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/workorders/${o.id}`} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
