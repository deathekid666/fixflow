"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import type { Lang } from "@/context/LanguageContext";
import { CURRENCIES } from "@/lib/currency";

type Tab = "profile" | "shop" | "security" | "preferences" | "appointments";

type Shop = {
  id: string; name: string; phone: string | null;
  address: string | null; email: string | null;
  logoUrl: string | null; googleMapsUrl: string | null;
  currency: string;
  plan: string; status: string; trialEndsAt: string | null;
};

type DayAvailability = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
};

type Closure = {
  id: string;
  date: string;
  reason: string | null;
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DEFAULT_DAYS: DayAvailability[] = DAY_NAMES.map((_, i) => ({
  dayOfWeek: i,
  openTime: "09:00",
  closeTime: "18:00",
  isOpen: i >= 1 && i <= 5,
}));

const INPUT = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500";

function Alert({ type, msg }: { type: "success" | "error"; msg: string }) {
  return (
    <div className={`text-sm px-4 py-3 rounded-lg border ${
      type === "success"
        ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
        : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
    }`}>{msg}</div>
  );
}

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const { theme, toggle } = useTheme();
  const { lang, setLang } = useLanguage();
  const logoRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("profile");

  // Profile
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  // Shop
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopForm, setShopForm] = useState({ name: "", phone: "", address: "", email: "", googleMapsUrl: "", currency: "MAD" });
  const [savingShop, setSavingShop] = useState(false);
  const [shopMsg, setShopMsg] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // SLA settings
  const [defaultSlaHours, setDefaultSlaHours] = useState(24);
  const [savingSla, setSavingSla] = useState(false);
  const [slaMsg, setSlaMsg] = useState("");

  // Appointments / availability
  const [days, setDays] = useState<DayAvailability[]>(DEFAULT_DAYS);
  const [slotDuration, setSlotDuration] = useState(60);
  const [maxConcurrent, setMaxConcurrent] = useState(2);
  const [savingAvail, setSavingAvail] = useState(false);
  const [availMsg, setAvailMsg] = useState("");
  const [closures, setClosures] = useState<Closure[]>([]);
  const [newClosureDate, setNewClosureDate] = useState("");
  const [newClosureReason, setNewClosureReason] = useState("");
  const [addingClosure, setAddingClosure] = useState(false);
  const [deletingClosureId, setDeletingClosureId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.shopId) {
      fetch(`/api/shops/${user.shopId}`, { credentials: "include" })
        .then(r => r.json())
        .then(s => {
          setShop(s);
          setShopForm({ name: s.name ?? "", phone: s.phone ?? "", address: s.address ?? "", email: s.email ?? "", googleMapsUrl: s.googleMapsUrl ?? "", currency: s.currency ?? "MAD" });
        }).catch(() => {});
      fetch(`/api/shops/${user.shopId}/settings`, { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setDefaultSlaHours(d.defaultSlaHours); })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (tab === "appointments" && user?.shopId) {
      loadAvailability();
      loadClosures();
    }
  }, [tab, user?.shopId]);

  async function loadAvailability() {
    if (!user?.shopId) return;
    const res = await fetch(`/api/shops/${user.shopId}/availability`, { credentials: "include" });
    if (res.ok) {
      const data: (DayAvailability & { slotDurationMinutes?: number; maxConcurrent?: number })[] = await res.json();
      setDays(data.map(d => ({ dayOfWeek: d.dayOfWeek, openTime: d.openTime, closeTime: d.closeTime, isOpen: d.isOpen })));
      if (data[0]?.slotDurationMinutes) setSlotDuration(data[0].slotDurationMinutes);
      if (data[0]?.maxConcurrent) setMaxConcurrent(data[0].maxConcurrent);
    }
  }

  async function loadClosures() {
    if (!user?.shopId) return;
    const res = await fetch(`/api/shops/${user.shopId}/closures`, { credentials: "include" });
    if (res.ok) setClosures(await res.json());
  }

  async function saveAvailability() {
    if (!user?.shopId) return;
    setSavingAvail(true); setAvailMsg("");
    const res = await fetch(`/api/shops/${user.shopId}/availability`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ days, slotDurationMinutes: slotDuration, maxConcurrent }),
    });
    setAvailMsg(res.ok ? "Availability saved." : "Failed to save.");
    setSavingAvail(false);
  }

  async function addClosure() {
    if (!newClosureDate || !user?.shopId) return;
    setAddingClosure(true);
    const res = await fetch(`/api/shops/${user.shopId}/closures`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ date: newClosureDate, reason: newClosureReason }),
    });
    if (res.ok) {
      setNewClosureDate(""); setNewClosureReason("");
      await loadClosures();
    }
    setAddingClosure(false);
  }

  async function deleteClosure(id: string) {
    if (!user?.shopId) return;
    setDeletingClosureId(id);
    await fetch(`/api/shops/${user.shopId}/closures?closureId=${id}`, {
      method: "DELETE", credentials: "include",
    });
    setClosures(prev => prev.filter(c => c.id !== id));
    setDeletingClosureId(null);
  }

  function updateDay(dayOfWeek: number, patch: Partial<DayAvailability>) {
    setDays(prev => prev.map(d => d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d));
  }

  async function saveProfile() {
    setSavingProfile(true); setProfileMsg(""); setProfileError("");
    const res = await fetch("/api/me/update", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email }),
    });
    if (res.ok) { setProfileMsg("Profile updated."); await refresh(); }
    else { const d = await res.json(); setProfileError(d.error || "Failed to update"); }
    setSavingProfile(false);
  }

  async function savePassword() {
    if (!currentPassword) { setPwError("Enter your current password"); return; }
    if (newPassword.length < 6) { setPwError("New password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setPwError("Passwords don't match"); return; }
    setSavingPw(true); setPwMsg(""); setPwError("");
    const res = await fetch("/api/me/update", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.ok) {
      setPwMsg("Password changed successfully.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } else {
      const d = await res.json(); setPwError(d.error || "Failed to change password");
    }
    setSavingPw(false);
  }

  async function saveShop() {
    if (!shop) return;
    setSavingShop(true); setShopMsg("");
    const res = await fetch(`/api/shops/${shop.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify(shopForm),
    });
    if (res.ok) setShopMsg("Shop settings saved.");
    setSavingShop(false);
  }

  async function saveSlaSettings() {
    if (!shop) return;
    setSavingSla(true); setSlaMsg("");
    const res = await fetch(`/api/shops/${shop.id}/settings`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ defaultSlaHours }),
    });
    setSlaMsg(res.ok ? "SLA setting saved." : "Failed to save.");
    setSavingSla(false);
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !shop) return;
    setUploadingLogo(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("tag", "logo");
    const res = await fetch(`/api/shops/${shop.id}/logo`, { method: "POST", credentials: "include", body: fd });
    if (res.ok) {
      const data = await res.json();
      setShop(prev => prev ? { ...prev, logoUrl: data.url } : prev);
    }
    setUploadingLogo(false);
    if (logoRef.current) logoRef.current.value = "";
  }

  const daysLeft = shop?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(shop.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "profile", label: "Profile", icon: "👤" },
    { key: "shop", label: "Shop", icon: "🏪" },
    { key: "security", label: "Security", icon: "🔒" },
    { key: "preferences", label: "Preferences", icon: "🎨" },
    { key: "appointments", label: "Appointments", icon: "📅" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account and shop</p>
      </div>

      {/* Plan banner */}
      {shop && (
        <div className={`border rounded-xl p-4 flex items-center justify-between flex-wrap gap-3 ${
          shop.status === "TRIAL" && daysLeft !== null && daysLeft <= 3
            ? "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800/50"
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        }`}>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              shop.status === "ACTIVE" ? "bg-green-500/20 text-green-600 dark:text-green-400" :
              shop.status === "TRIAL" ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" :
              "bg-red-500/20 text-red-600 dark:text-red-400"
            }`}>{shop.status}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium">{shop.plan}</span>
            {shop.status === "TRIAL" && daysLeft !== null && (
              <span className={`text-xs font-medium ${daysLeft <= 3 ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
                {daysLeft} day{daysLeft !== 1 ? "s" : ""} left in trial
              </span>
            )}
          </div>
          {shop.plan === "FREE" && (
            <a href="mailto:support@fixflow.ma?subject=Upgrade to PRO"
              className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
              Upgrade to PRO
            </a>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
              tab === t.key
                ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}>
            <span className="text-base">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === "profile" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Profile Information</h2>
          {profileMsg && <Alert type="success" msg={profileMsg} />}
          {profileError && <Alert type="error" msg={profileError} />}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={INPUT} />
            </div>
          </div>
          <div className="pt-1">
            <p className="text-xs text-slate-500 mb-1">Role</p>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg">{user?.role}</span>
          </div>
          <button onClick={saveProfile} disabled={savingProfile}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </div>
      )}

      {/* Shop tab */}
      {tab === "shop" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          {user?.role !== "ADMIN" ? (
            <p className="text-sm text-slate-500 text-center py-6">Only admins can edit shop settings.</p>
          ) : !shop ? (
            <p className="text-sm text-slate-500 text-center py-6">Loading shop...</p>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Shop Settings</h2>
              {shopMsg && <Alert type="success" msg={shopMsg} />}

              {/* Logo */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
                  {shop.logoUrl
                    ? <img src={shop.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    : <span className="text-2xl">🔧</span>}
                </div>
                <div>
                  <p className="text-sm text-slate-900 dark:text-white font-medium">Shop Logo</p>
                  <p className="text-xs text-slate-500 mb-2">Shown on receipts and the customer portal</p>
                  <button onClick={() => logoRef.current?.click()} disabled={uploadingLogo}
                    className="text-xs px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">
                    {uploadingLogo ? "Uploading..." : "Upload Logo"}
                  </button>
                  <input ref={logoRef} type="file" className="hidden" accept="image/*" onChange={uploadLogo} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">Shop Name</label>
                  <input value={shopForm.name} onChange={e => setShopForm(p => ({ ...p, name: e.target.value }))} className={INPUT} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Phone</label>
                  <input value={shopForm.phone} onChange={e => setShopForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+212..." className={INPUT} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Email</label>
                  <input type="email" value={shopForm.email} onChange={e => setShopForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="shop@example.com" className={INPUT} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">Address</label>
                  <input value={shopForm.address} onChange={e => setShopForm(p => ({ ...p, address: e.target.value }))}
                    placeholder="Shop address" className={INPUT} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">Google Maps URL</label>
                  <input value={shopForm.googleMapsUrl} onChange={e => setShopForm(p => ({ ...p, googleMapsUrl: e.target.value }))}
                    placeholder="https://maps.google.com/..." className={INPUT} />
                  <p className="text-xs text-slate-500 mt-1">Paste your Google Maps business link — shown as a "Get Directions" button on your booking page.</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Currency</label>
                  <select value={shopForm.currency} onChange={e => setShopForm(p => ({ ...p, currency: e.target.value }))}
                    className={INPUT}>
                    {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Used for all amounts displayed in invoices, reports and the dashboard.</p>
                </div>
              </div>
              <button onClick={saveShop} disabled={savingShop}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                {savingShop ? "Saving..." : "Save Shop Settings"}
              </button>

              {/* SLA Settings */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">SLA Settings</h3>
                <p className="text-xs text-slate-500">Default hours before a work order breaches its SLA deadline.</p>
                {slaMsg && <Alert type={slaMsg.includes("Failed") ? "error" : "success"} msg={slaMsg} />}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button onClick={() => setDefaultSlaHours(h => Math.max(1, h - 1))}
                      className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-lg font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">−</button>
                    <span className="w-14 text-center text-sm font-semibold text-slate-900 dark:text-white tabular-nums">{defaultSlaHours}h</span>
                    <button onClick={() => setDefaultSlaHours(h => h + 1)}
                      className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-lg font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">+</button>
                  </div>
                  <div className="flex gap-2">
                    {[24, 48, 72].map(h => (
                      <button key={h} onClick={() => setDefaultSlaHours(h)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${defaultSlaHours === h ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"}`}>
                        {h}h
                      </button>
                    ))}
                  </div>
                  <button onClick={saveSlaSettings} disabled={savingSla}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors ml-auto">
                    {savingSla ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              {/* Public links & embed codes */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Public Links & Embeds</h3>

                {/* Booking page */}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Booking Page</label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={`https://fixflow-ruddy.vercel.app/book/${shop.id}`}
                      className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300 font-mono focus:outline-none select-all"
                      onClick={e => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(`https://fixflow-ruddy.vercel.app/book/${shop.id}`)}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition-colors flex-shrink-0">
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Share this link so customers can book appointments directly.</p>
                </div>

                {/* Widget embed code */}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Website Widget Embed Code</label>
                  <div className="relative">
                    <textarea
                      readOnly
                      rows={3}
                      value={`<iframe src="https://fixflow-ruddy.vercel.app/widget/${shop.id}" width="420" height="600" frameborder="0"></iframe>`}
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300 font-mono focus:outline-none resize-none"
                      onClick={e => (e.target as HTMLTextAreaElement).select()}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-xs text-slate-400">Paste this on your website to embed the repair tracker + booking widget.</p>
                    <button
                      onClick={() => navigator.clipboard.writeText(`<iframe src="https://fixflow-ruddy.vercel.app/widget/${shop.id}" width="420" height="600" frameborder="0"></iframe>`)}
                      className="ml-3 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition-colors flex-shrink-0">
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Google My Business instructions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Google My Business</h3>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">📍</span>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">Add a Booking Button to your Google profile</p>
                      <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
                        <li>Go to your Google Business Profile</li>
                        <li>Click <span className="font-medium text-slate-700 dark:text-slate-300">Edit profile → Add button</span></li>
                        <li>Choose <span className="font-medium text-slate-700 dark:text-slate-300">Book</span></li>
                        <li>Paste your booking link below</li>
                      </ol>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={`https://fixflow-ruddy.vercel.app/book/${shop.id}`}
                      className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300 font-mono focus:outline-none select-all"
                      onClick={e => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(`https://fixflow-ruddy.vercel.app/book/${shop.id}`)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors flex-shrink-0 font-medium">
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Preferences tab */}
      {tab === "preferences" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-6">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Preferences</h2>

          {/* Dark mode toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Dark Mode</p>
              <p className="text-xs text-slate-500 mt-0.5">{theme === "dark" ? "Dark theme is on" : "Light theme is on"}</p>
            </div>
            <button
              onClick={toggle}
              role="switch"
              aria-checked={theme === "dark"}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                theme === "dark" ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                theme === "dark" ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
          </div>

          {/* Language switcher */}
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white mb-3">Language</p>
            <div className="grid grid-cols-3 gap-2">
              {([["en", "English"], ["fr", "Français"], ["ar", "العربية"]] as [Lang, string][]).map(([l, label]) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    lang === l
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Security tab */}
      {tab === "security" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Change Password</h2>
          {pwMsg && <Alert type="success" msg={pwMsg} />}
          {pwError && <Alert type="error" msg={pwError} />}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Current Password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password" className={INPUT} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters" className={INPUT} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password" className={INPUT} />
          </div>
          <button onClick={savePassword} disabled={savingPw}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {savingPw ? "Changing..." : "Change Password"}
          </button>
        </div>
      )}

      {/* Appointments tab */}
      {tab === "appointments" && (
        <div className="space-y-4">
          {user?.role !== "ADMIN" ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <p className="text-sm text-slate-500 text-center py-6">Only admins can edit appointment settings.</p>
            </div>
          ) : (
            <>
              {/* Weekly schedule */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Weekly Schedule</h2>
                {availMsg && <Alert type={availMsg.includes("Failed") ? "error" : "success"} msg={availMsg} />}

                <div className="space-y-2">
                  {days.map(day => (
                    <div key={day.dayOfWeek} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      day.isOpen
                        ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                        : "bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800"
                    }`}>
                      {/* Day toggle */}
                      <button
                        onClick={() => updateDay(day.dayOfWeek, { isOpen: !day.isOpen })}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                          day.isOpen ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          day.isOpen ? "translate-x-4" : "translate-x-0"
                        }`} />
                      </button>

                      {/* Day name */}
                      <span className={`w-10 text-xs font-semibold ${
                        day.isOpen ? "text-slate-900 dark:text-white" : "text-slate-400"
                      }`}>{DAY_SHORT[day.dayOfWeek]}</span>

                      {day.isOpen ? (
                        <>
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="time"
                              value={day.openTime}
                              onChange={e => updateDay(day.dayOfWeek, { openTime: e.target.value })}
                              className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 w-28"
                            />
                            <span className="text-xs text-slate-400">to</span>
                            <input
                              type="time"
                              value={day.closeTime}
                              onChange={e => updateDay(day.dayOfWeek, { closeTime: e.target.value })}
                              className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 w-28"
                            />
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 flex-1">Closed</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Global slot / concurrent settings */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Slot Duration</label>
                    <div className="flex gap-1">
                      {[30, 60, 90].map(m => (
                        <button key={m} onClick={() => setSlotDuration(m)}
                          className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                            slotDuration === m
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                          }`}>
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Max Concurrent</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setMaxConcurrent(v => Math.max(1, v - 1))}
                        className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">−</button>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white w-6 text-center">{maxConcurrent}</span>
                      <button onClick={() => setMaxConcurrent(v => Math.min(10, v + 1))}
                        className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">+</button>
                      <span className="text-xs text-slate-400">per slot</span>
                    </div>
                  </div>
                </div>

                <button onClick={saveAvailability} disabled={savingAvail}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {savingAvail ? "Saving..." : "Save Schedule"}
                </button>
              </div>

              {/* Closure dates */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Holiday & Closure Dates</h2>
                <p className="text-xs text-slate-500">Dates when the shop is closed for appointments (holidays, events, etc.)</p>

                {/* Add closure */}
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="date"
                    value={newClosureDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => setNewClosureDate(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <input
                    placeholder="Reason (optional)"
                    value={newClosureReason}
                    onChange={e => setNewClosureReason(e.target.value)}
                    className="flex-1 min-w-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button onClick={addClosure} disabled={addingClosure || !newClosureDate}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors">
                    {addingClosure ? "..." : "+ Add"}
                  </button>
                </div>

                {/* Closure list */}
                {closures.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3">No closure dates added</p>
                ) : (
                  <div className="space-y-2">
                    {closures.map(c => (
                      <div key={c.id} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {new Date(c.date).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                          </span>
                          {c.reason && <span className="text-xs text-slate-500">{c.reason}</span>}
                        </div>
                        <button onClick={() => deleteClosure(c.id)} disabled={deletingClosureId === c.id}
                          className="text-xs text-red-500 hover:text-red-400 disabled:opacity-50 flex-shrink-0">
                          {deletingClosureId === c.id ? "..." : "✕ Remove"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
