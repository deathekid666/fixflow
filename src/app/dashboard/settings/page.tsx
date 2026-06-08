"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

type Shop = {
  id: string; name: string; phone: string | null;
  address: string | null; email: string | null;
  logoUrl: string | null; plan: string; status: string; trialEndsAt: string | null;
};

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const logoRef = useRef<HTMLInputElement>(null);

  // Profile
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");

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
    if (newPassword && newPassword !== confirmPassword) { setProfileError("Passwords don't match"); return; }
    setSavingProfile(true); setProfileMsg(""); setProfileError("");
    const res = await fetch("/api/me/update", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, currentPassword: currentPassword || undefined, newPassword: newPassword || undefined }),
    });
    if (res.ok) {
      setProfileMsg("Profile updated successfully");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      await refresh();
    } else {
      const d = await res.json();
      setProfileError(d.error || "Failed to update");
    }
    setSavingProfile(false);
  }

  async function saveShop() {
    if (!shop) return;
    setSavingShop(true); setShopMsg("");
    const res = await fetch(`/api/shops/${shop.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify(shopForm),
    });
    if (res.ok) setShopMsg("Shop updated successfully");
    setSavingShop(false);
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !shop) return;
    setUploadingLogo(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("tag", "logo");
    // Upload to attachments and use URL as logo
    const res = await fetch(`/api/shops/${shop.id}/logo`, {
      method: "POST", credentials: "include", body: fd,
    });
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

  return (
    <div className="p-6 space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-white">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your profile and shop settings</p>
      </div>

      {/* Plan info */}
      {shop && (
        <div className={`border rounded-xl p-4 flex items-center justify-between flex-wrap gap-3 ${
          shop.status === "TRIAL" && daysLeft !== null && daysLeft <= 3
            ? "bg-red-950/20 border-red-800/50"
            : "bg-slate-900 border-slate-800"
        }`}>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              shop.status === "ACTIVE" ? "bg-green-500/20 text-green-400" :
              shop.status === "TRIAL" ? "bg-yellow-500/20 text-yellow-400" :
              "bg-red-500/20 text-red-400"
            }`}>{shop.status}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">{shop.plan}</span>
            {shop.status === "TRIAL" && daysLeft !== null && (
              <span className={`text-xs font-medium ${daysLeft <= 3 ? "text-red-400" : "text-slate-400"}`}>
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

      {/* Profile settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300">Profile</h2>
        {profileMsg && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg">{profileMsg}</div>}
        {profileError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">{profileError}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div className="border-t border-slate-800 pt-4 space-y-3">
          <p className="text-xs text-slate-500 font-medium">Change Password</p>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Current Password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>
        <button onClick={saveProfile} disabled={savingProfile}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
          {savingProfile ? "Saving..." : "Save Profile"}
        </button>
      </div>

      {/* Shop settings */}
      {shop && user?.role === "ADMIN" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300">Shop Settings</h2>
          {shopMsg && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg">{shopMsg}</div>}

          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden border border-slate-700">
              {shop.logoUrl ? (
                <img src={shop.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">🔧</span>
              )}
            </div>
            <div>
              <p className="text-sm text-white font-medium">Shop Logo</p>
              <p className="text-xs text-slate-500 mb-2">Shows on receipts and customer portal</p>
              <button onClick={() => logoRef.current?.click()} disabled={uploadingLogo}
                className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors">
                {uploadingLogo ? "Uploading..." : "Upload Logo"}
              </button>
              <input ref={logoRef} type="file" className="hidden" accept="image/*" onChange={uploadLogo} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Shop Name</label>
              <input value={shopForm.name} onChange={e => setShopForm(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Phone</label>
              <input value={shopForm.phone} onChange={e => setShopForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+212..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Email</label>
              <input type="email" value={shopForm.email} onChange={e => setShopForm(p => ({ ...p, email: e.target.value }))}
                placeholder="shop@example.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Address</label>
              <input value={shopForm.address} onChange={e => setShopForm(p => ({ ...p, address: e.target.value }))}
                placeholder="Shop address"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <button onClick={saveShop} disabled={savingShop}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {savingShop ? "Saving..." : "Save Shop Settings"}
          </button>
        </div>
      )}
    </div>
  );
}