"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import type { Lang } from "@/context/LanguageContext";

type Tab = "profile" | "shop" | "security" | "preferences";

type Shop = {
  id: string; name: string; phone: string | null;
  address: string | null; email: string | null;
  logoUrl: string | null; plan: string; status: string; trialEndsAt: string | null;
};

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
  const [shopForm, setShopForm] = useState({ name: "", phone: "", address: "", email: "" });
  const [savingShop, setSavingShop] = useState(false);
  const [shopMsg, setShopMsg] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (user?.shopId) {
      fetch(`/api/shops/${user.shopId}`, { credentials: "include" })
        .then(r => r.json())
        .then(s => {
          setShop(s);
          setShopForm({ name: s.name ?? "", phone: s.phone ?? "", address: s.address ?? "", email: s.email ?? "" });
        }).catch(() => {});
    }
  }, [user]);

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
      <div className="flex gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
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
              </div>
              <button onClick={saveShop} disabled={savingShop}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                {savingShop ? "Saving..." : "Save Shop Settings"}
              </button>
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
    </div>
  );
}
