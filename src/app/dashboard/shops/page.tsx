"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

type Shop = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  plan: string;
  trialEndsAt: string | null;
  createdAt: string;
};

export default function ShopSettingsPage() {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "" });

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/shops", { credentials: "include" });
    const data = await res.json();
    const s = Array.isArray(data) ? data[0] : null;
    if (s) {
      setShop(s);
      setForm({ name: s.name, address: s.address || "", phone: s.phone || "", email: s.email || "" });
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!form.name) { setError("Shop name is required"); return; }
    setSaving(true); setError("");
    const res = await fetch(`/api/shops/${shop?.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await load();
    } else {
      const d = await res.json();
      setError(d.error || "Failed to save");
    }
    setSaving(false);
  }

  if (!user?.isSuperAdmin) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-slate-400 text-sm">Super admin access required.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="p-6 text-slate-500 text-sm">Loading...</div>;

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-white">Shop Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your shop information</p>
      </div>

      {/* Plan & status banner */}
      {shop && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                shop.status === "ACTIVE" ? "bg-green-500/20 text-green-400" :
                shop.status === "TRIAL" ? "bg-yellow-500/20 text-yellow-400" :
                "bg-red-500/20 text-red-400"
              }`}>{shop.status}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">{shop.plan}</span>
            </div>
            {shop.status === "TRIAL" && shop.trialEndsAt && (
              <p className="text-xs text-slate-500">
                Trial ends: <span className="text-yellow-400">{new Date(shop.trialEndsAt).toLocaleDateString()}</span>
                {" "}({Math.max(0, Math.ceil((new Date(shop.trialEndsAt).getTime() - Date.now()) / 86400000))} days left)
              </p>
            )}
          </div>
          <p className="text-xs text-slate-500">Member since {new Date(shop.createdAt).toLocaleDateString()}</p>
        </div>
      )}

      {/* Edit form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300">Shop Information</h2>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}
        {saved && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg">✓ Saved successfully</div>}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-slate-400 mb-1 block">Shop Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Phone</label>
            <input placeholder="+212..." value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Email</label>
            <input type="email" placeholder="shop@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-slate-400 mb-1 block">Address</label>
            <input placeholder="Shop address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}