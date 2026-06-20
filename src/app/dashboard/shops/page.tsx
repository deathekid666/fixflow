"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

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
  _count?: { workOrders: number; users: number };
  users?: { name: string; email: string }[];
};

const STATUS_COLORS: Record<string, string> = {
  TRIAL: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  ACTIVE: "bg-green-500/20 text-green-600 dark:text-green-400",
  SUSPENDED: "bg-red-500/20 text-red-600 dark:text-red-400",
};

export default function ShopsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [myShop, setMyShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "" });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      if (user?.isSuperAdmin) {
        // Load all shops for super admin
        const res = await fetch("/api/admin/shops", { credentials: "include" });
        const data = await res.json();
        setShops(Array.isArray(data) ? data : []);

        // Also load own shop
        const myRes = await fetch("/api/shops", { credentials: "include" });
        const myData = await myRes.json();
        const s = Array.isArray(myData) && myData.length > 0 ? myData[0] : null;
        if (s) {
          setMyShop(s);
          setForm({ name: s.name ?? "", address: s.address ?? "", phone: s.phone ?? "", email: s.email ?? "" });
        }
      } else {
        const res = await fetch("/api/shops", { credentials: "include" });
        const data = await res.json();
        const s = Array.isArray(data) && data.length > 0 ? data[0] : null;
        if (s) {
          setMyShop(s);
          setForm({ name: s.name ?? "", address: s.address ?? "", phone: s.phone ?? "", email: s.email ?? "" });
        }
      }
    } catch { setError("Failed to load"); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    if (!form.name) { setError("Shop name is required"); return; }
    if (!myShop) return;
    setSaving(true); setError("");
    const res = await fetch(`/api/shops/${myShop.id}`, {
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

  async function updateShopStatus(shopId: string, data: { status?: string; plan?: string }) {
    setUpdating(shopId);
    await fetch("/api/admin/shops", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ shopId, ...data }),
    });
    await load();
    setUpdating(null);
  }

  if (!user?.isSuperAdmin) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-slate-400 text-sm">{t("superAdminRequired")}</p>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="p-6 space-y-4">
      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-40 animate-pulse" />
      {[0,1,2].map(i => (
        <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/4" />
        </div>
      ))}
    </div>
  );

  const daysLeft = myShop?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(myShop.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  const totalOrders = shops.reduce((s, sh) => s + (sh._count?.workOrders ?? 0), 0);

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t("shopManagement")}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t("shopManagementSubtitle")}</p>
      </div>

      {/* ── MY SHOP SETTINGS ─────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">{t("myShopSettings")}</h2>

        {myShop && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[myShop.status] ?? "bg-slate-700 text-slate-400"}`}>{myShop.status}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">{myShop.plan}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              {myShop.status === "TRIAL" && daysLeft !== null && (
                <span>{t("trialDaysLeft")} <span className="text-yellow-600 dark:text-yellow-400">{daysLeft} {t("daysLeft")}</span></span>
              )}
              <span>{t("sinceLabel")} {new Date(myShop.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}
          {saved && <div className="bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-sm px-4 py-3 rounded-lg">{t("savedSuccessfully")}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">{t("shopName")} *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Phone</label>
              <input placeholder="+212..." value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Email</label>
              <input type="email" placeholder="shop@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Address</label>
              <input placeholder="Shop address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {saving ? t("savingLabel") : t("saveChanges")}
          </button>
        </div>
      </div>

      {/* ── ALL SHOPS (SUPER ADMIN) ───────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">{t("allTenantShops")}</h2>
          <div className="flex gap-3 text-xs text-slate-500">
            <span>🏪 {shops.length} shops</span>
            <span>📋 {totalOrders} total orders</span>
            <span className="text-yellow-600 dark:text-yellow-400">⏳ {shops.filter(s => s.status === "TRIAL").length} trial</span>
            <span className="text-green-600 dark:text-green-400">✅ {shops.filter(s => s.status === "ACTIVE").length} active</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                {[t("shopCol"), t("ownerCol"), t("ordersShopCol"), "Status", t("planCol"), t("trialEnds"), t("actionsCol")].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shops.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">{t("noShopsYet")}</td></tr>
              )}
              {shops.map(shop => (
                <tr key={shop.id} className="border-b border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                  <td className="px-4 py-3">
                    <p className="text-slate-900 dark:text-white font-medium">{shop.name || "—"}</p>
                    {shop.phone && <p className="text-xs text-slate-500">{shop.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {shop.users?.[0] ? (
                      <div>
                        <p className="text-slate-700 dark:text-slate-300 text-xs">{shop.users[0].name}</p>
                        <p className="text-slate-500 text-xs">{shop.users[0].email}</p>
                      </div>
                    ) : <span className="text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">{shop._count?.workOrders ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[shop.status] ?? "bg-slate-700 text-slate-400"}`}>
                      {shop.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select value={shop.plan}
                      onChange={e => updateShopStatus(shop.id, { plan: e.target.value })}
                      disabled={updating === shop.id}
                      className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none">
                      <option value="FREE">FREE</option>
                      <option value="PRO">PRO</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {shop.trialEndsAt ? new Date(shop.trialEndsAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {shop.status !== "ACTIVE" && (
                        <button onClick={() => updateShopStatus(shop.id, { status: "ACTIVE" })}
                          disabled={updating === shop.id}
                          className="text-xs px-2 py-1 bg-green-600/30 hover:bg-green-600/50 text-green-400 rounded transition-colors">
                          {t("activate")}
                        </button>
                      )}
                      {shop.status !== "TRIAL" && (
                        <button onClick={() => updateShopStatus(shop.id, { status: "TRIAL" })}
                          disabled={updating === shop.id}
                          className="text-xs px-2 py-1 bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-400 rounded transition-colors">
                          {t("trialBtn")}
                        </button>
                      )}
                      {shop.status !== "SUSPENDED" && (
                        <button onClick={() => updateShopStatus(shop.id, { status: "SUSPENDED" })}
                          disabled={updating === shop.id}
                          className="text-xs px-2 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-400 rounded transition-colors">
                          {t("suspendBtn")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}