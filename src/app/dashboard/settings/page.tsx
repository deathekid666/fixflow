"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import type { Lang } from "@/context/LanguageContext";
import { CURRENCIES } from "@/lib/currency";
import { loadSocialSettings, saveSocialSettings } from "@/components/SocialShareModal";
import { DEFAULT_TEMPLATES } from "@/lib/whatsapp";
import {
  User, Store, Palette, CreditCard, Bell, Calendar, Puzzle, Shield,
  Eye, EyeOff, Copy, Check, Trash2, Plus, ExternalLink, Key, RefreshCw,
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle, X,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "profile" | "shop" | "appearance" | "billing" | "notifications" | "appointments" | "integrations" | "permissions";

type ApiKey = { id: string; name: string; key: string; lastUsed: string | null; createdAt: string; isActive: boolean };

type Shop = {
  id: string; name: string; phone: string | null; whatsappPhone: string | null;
  address: string | null; email: string | null; logoUrl: string | null;
  googleMapsUrl: string | null; currency: string;
  taxEnabled: boolean; taxRate: number; taxLabel: string;
  plan: string; status: string; trialEndsAt: string | null;
  city: string | null; country: string | null; lat: number | null; lng: number | null;
  certification: string | null;
};

type DayAvailability = { dayOfWeek: number; openTime: string; closeTime: string; isOpen: boolean };
type Closure = { id: string; date: string; reason: string | null };

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_DAYS: DayAvailability[] = DAY_NAMES.map((_, i) => ({
  dayOfWeek: i, openTime: "09:00", closeTime: "18:00", isOpen: i >= 1 && i <= 5,
}));

// ─── Design tokens ────────────────────────────────────────────────────────────

const INPUT = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors";
const CARD = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl";
const BTN_PRIMARY = "inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors";
const BTN_SECONDARY = "inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors";
const BTN_DANGER = "inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-lg transition-colors";
const LABEL = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5";

// ─── Small reusable components ────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
    </div>
  );
}

function Divider() {
  return <hr className="border-slate-100 dark:border-slate-800 my-5" />;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} role="switch" aria-checked={value}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${value ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}>
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function InlineMsg({ msg }: { msg: string }) {
  if (!msg) return null;
  const isError = msg.toLowerCase().includes("fail") || msg.startsWith("❌");
  return (
    <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${isError ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400" : "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400"}`}>
      {isError ? <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> : <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />}
      {msg}
    </div>
  );
}

function RowToggle({ label, description, value, onChange }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm text-slate-900 dark:text-white font-medium">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

function SocialSharingSettings() {
  const [s, setS] = useState(loadSocialSettings());
  function update<K extends keyof ReturnType<typeof loadSocialSettings>>(key: K, val: ReturnType<typeof loadSocialSettings>[K]) {
    const next = { ...s, [key]: val };
    saveSocialSettings(next);
    setS(next);
  }
  return (
    <div className="space-y-3">
      <RowToggle label="Show price on image" description="Display the repair total on the generated share card" value={s.showPrice} onChange={v => update("showPrice", v)} />
      <RowToggle label="Show FixFlow badge" description='Add "Powered by FixFlow" to shared repair images' value={s.showBadge} onChange={v => update("showBadge", v)} />
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm text-slate-900 dark:text-white font-medium">Card background color</p>
          <p className="text-xs text-slate-500 mt-0.5">Used when photos don't fill the full frame</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">{s.bgColor}</span>
          <input type="color" value={s.bgColor} onChange={e => update("bgColor", e.target.value)}
            className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-1 bg-white dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Shop
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopForm, setShopForm] = useState({ name: "", phone: "", whatsappPhone: "", address: "", email: "", googleMapsUrl: "", currency: "MAD", taxEnabled: false, taxRate: 20, taxLabel: "TVA", city: "", country: "", lat: "", lng: "", certification: "" });
  const [savingShop, setSavingShop] = useState(false);
  const [shopMsg, setShopMsg] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // SLA
  const [defaultSlaHours, setDefaultSlaHours] = useState(24);
  const [savingSla, setSavingSla] = useState(false);
  const [slaMsg, setSlaMsg] = useState("");

  // Appearance
  const [receiptSize, setReceiptSize] = useState("A4");
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [receiptMsg, setReceiptMsg] = useState("");
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({ newMessage: true, lowStock: true, newAppointment: true, slaBreach: true, orderOverdue: true, certification: true, newRating: true });
  const [savingNotifPrefs, setSavingNotifPrefs] = useState(false);
  const [notifPrefsMsg, setNotifPrefsMsg] = useState("");

  // Billing
  const [billingData, setBillingData] = useState<{ currentPlan: string; status: string; trialEndsAt: string | null; stripePlanSelected: string | null } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradePlanKey, setUpgradePlanKey] = useState("");

  // Notifications
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsProvider, setSmsProvider] = useState("mock");
  const [notifyStatuses, setNotifyStatuses] = useState<string[]>(["DONE", "DELIVERED"]);
  const [smsLanguage, setSmsLanguage] = useState("en");
  const [includeTrackingLink, setIncludeTrackingLink] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifMsg, setNotifMsg] = useState("");
  const [waTemplateStatus, setWaTemplateStatus] = useState("");
  const [waTemplatePickup, setWaTemplatePickup] = useState("");
  const [waTemplateAppointment, setWaTemplateAppointment] = useState("");
  const [savingWaTemplates, setSavingWaTemplates] = useState(false);
  const [waTemplateMsg, setWaTemplateMsg] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testMsg, setTestMsg] = useState("");
  // Email (in Notifications)
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailDomain, setEmailDomain] = useState("");
  const [emailNotifyWelcome, setEmailNotifyWelcome] = useState(true);
  const [emailNotifyStatus, setEmailNotifyStatus] = useState(true);
  const [emailNotifyPickup, setEmailNotifyPickup] = useState(true);
  const [emailNotifyAppt, setEmailNotifyAppt] = useState(true);
  const [emailNotifyReminder, setEmailNotifyReminder] = useState(true);
  const [savingEmailSettings, setSavingEmailSettings] = useState(false);
  const [emailSettingsMsg, setEmailSettingsMsg] = useState("");
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailMsg, setTestEmailMsg] = useState("");
  const [resendConfigured, setResendConfigured] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  // Twilio (in Notifications)
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioPhone, setTwilioPhone] = useState("");
  const [savingTwilio, setSavingTwilio] = useState(false);
  const [twilioMsg, setTwilioMsg] = useState("");

  // Appointments
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

  // Integrations
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);
  const [tvToken, setTvToken] = useState<string | null>(null);
  const [loadingTvToken, setLoadingTvToken] = useState(false);
  const [generatingTvToken, setGeneratingTvToken] = useState(false);
  const [tvTokenCopied, setTvTokenCopied] = useState(false);
  const [imeiProApiKey, setImeiProApiKey] = useState("");
  const [savingImeiKey, setSavingImeiKey] = useState(false);
  const [imeiKeyMsg, setImeiKeyMsg] = useState("");
  const [checkMendApiKey, setCheckMendApiKey] = useState("");
  const [savingCheckMend, setSavingCheckMend] = useState(false);
  const [checkMendMsg, setCheckMendMsg] = useState("");
  const [testingImeiConn, setTestingImeiConn] = useState(false);
  const [imeiConnMsg, setImeiConnMsg] = useState("");

  // Permissions
  const [engineerPerms, setEngineerPerms] = useState<Record<string, boolean>>({});
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [savingPerm, setSavingPerm] = useState<string | null>(null);
  const [permsMsg, setPermsMsg] = useState("");

  // ─── Data loading ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user?.shopId) return;
    fetch(`/api/shops/${user.shopId}`, { credentials: "include" })
      .then(r => r.json())
      .then(s => {
        setShop(s);
        setShopForm({ name: s.name ?? "", phone: s.phone ?? "", whatsappPhone: s.whatsappPhone ?? "", address: s.address ?? "", email: s.email ?? "", googleMapsUrl: s.googleMapsUrl ?? "", currency: s.currency ?? "MAD", taxEnabled: s.taxEnabled ?? false, taxRate: s.taxRate ?? 20, taxLabel: s.taxLabel ?? "TVA", city: s.city ?? "", country: s.country ?? "", lat: s.lat?.toString() ?? "", lng: s.lng?.toString() ?? "", certification: s.certification ?? "" });
      }).catch(() => {});
    fetch(`/api/shops/${user.shopId}/settings`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        setDefaultSlaHours(d.defaultSlaHours ?? 24);
        setSmsEnabled(d.smsEnabled ?? false);
        setSmsProvider(d.smsProvider ?? "mock");
        setNotifyStatuses((d.notifyStatuses ?? "DONE,DELIVERED").split(",").map((s: string) => s.trim()).filter(Boolean));
        setSmsLanguage(d.smsLanguage ?? "en");
        setIncludeTrackingLink(d.includeTrackingLink ?? true);
        setWaTemplateStatus(d.waTemplateStatus ?? "");
        setWaTemplatePickup(d.waTemplatePickup ?? "");
        setWaTemplateAppointment(d.waTemplateAppointment ?? "");
        setImeiProApiKey(d.imeiProApiKey ?? "");
        setCheckMendApiKey(d.checkMendApiKey ?? "");
        const rs = d.receiptSize ?? "A4";
        setReceiptSize(rs);
        if (typeof window !== "undefined") localStorage.setItem("fixflow_receipt_size", rs);
        setEmailEnabled(d.emailEnabled ?? false);
        setEmailDomain(d.emailDomain ?? "");
        setEmailNotifyWelcome(d.emailNotifyWelcome ?? true);
        setEmailNotifyStatus(d.emailNotifyStatus ?? true);
        setEmailNotifyPickup(d.emailNotifyPickup ?? true);
        setEmailNotifyAppt(d.emailNotifyAppt ?? true);
        setEmailNotifyReminder(d.emailNotifyReminder ?? true);
        setResendConfigured(d.resendConfigured ?? false);
        setTwilioSid(d.twilioSid ?? "");
        setTwilioToken(d.twilioToken ?? "");
        setTwilioPhone(d.twilioPhone ?? "");
      }).catch(() => {});
  }, [user]);

  const loadAvailability = useCallback(async () => {
    if (!user?.shopId) return;
    const res = await fetch(`/api/shops/${user.shopId}/availability`, { credentials: "include" });
    if (res.ok) {
      const data: (DayAvailability & { slotDurationMinutes?: number; maxConcurrent?: number })[] = await res.json();
      setDays(data.map(d => ({ dayOfWeek: d.dayOfWeek, openTime: d.openTime, closeTime: d.closeTime, isOpen: d.isOpen })));
      if (data[0]?.slotDurationMinutes) setSlotDuration(data[0].slotDurationMinutes);
      if (data[0]?.maxConcurrent) setMaxConcurrent(data[0].maxConcurrent);
    }
  }, [user?.shopId]);

  const loadClosures = useCallback(async () => {
    if (!user?.shopId) return;
    const res = await fetch(`/api/shops/${user.shopId}/closures`, { credentials: "include" });
    if (res.ok) setClosures(await res.json());
  }, [user?.shopId]);

  const loadApiKeys = useCallback(async () => {
    const res = await fetch("/api/keys", { credentials: "include" });
    if (res.ok) setApiKeys(await res.json());
  }, []);

  const loadPerms = useCallback(async () => {
    setLoadingPerms(true);
    const res = await fetch("/api/permissions", { credentials: "include" });
    if (res.ok) { const d = await res.json(); setEngineerPerms(d.ENGINEER ?? {}); }
    setLoadingPerms(false);
  }, []);

  useEffect(() => {
    if (tab === "appointments" && user?.shopId) { loadAvailability(); loadClosures(); }
  }, [tab, user?.shopId, loadAvailability, loadClosures]);

  useEffect(() => {
    if (tab === "integrations") {
      loadApiKeys();
      setLoadingTvToken(true);
      fetch("/api/tv/token", { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setTvToken(d.tvToken ?? null); })
        .catch(() => {})
        .finally(() => setLoadingTvToken(false));
    }
  }, [tab, loadApiKeys]);

  useEffect(() => {
    if (tab === "permissions" && user?.role === "ADMIN") loadPerms();
  }, [tab, loadPerms]);

  useEffect(() => {
    if (tab === "notifications") {
      fetch("/api/notifications/preferences", { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setNotifPrefs(d); }).catch(() => {});
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "billing") {
      fetch("/api/billing", { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setBillingData(d); }).catch(() => {});
    }
  }, [tab]);

  // ─── Save functions ───────────────────────────────────────────────────────

  async function saveProfile() {
    setSavingProfile(true); setProfileMsg(""); setProfileError("");
    const res = await fetch("/api/me/update", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name, email }) });
    if (res.ok) { setProfileMsg("Profile updated."); await refresh(); setTimeout(() => setProfileMsg(""), 3000); }
    else { const d = await res.json(); setProfileError(d.error || "Failed to update"); }
    setSavingProfile(false);
  }

  async function savePassword() {
    if (!currentPassword) { setPwError("Enter your current password"); return; }
    if (newPassword.length < 6) { setPwError("At least 6 characters required"); return; }
    if (newPassword !== confirmPassword) { setPwError("Passwords don't match"); return; }
    setSavingPw(true); setPwMsg(""); setPwError("");
    const res = await fetch("/api/me/update", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ currentPassword, newPassword }) });
    if (res.ok) { setPwMsg("Password changed."); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setTimeout(() => setPwMsg(""), 3000); }
    else { const d = await res.json(); setPwError(d.error || "Failed to change password"); }
    setSavingPw(false);
  }

  async function saveShop() {
    if (!shop) return;
    setSavingShop(true); setShopMsg("");
    const res = await fetch(`/api/shops/${shop.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(shopForm) });
    if (res.ok) { setShopMsg("Saved."); setTimeout(() => setShopMsg(""), 3000); }
    else setShopMsg("Failed to save.");
    setSavingShop(false);
  }

  async function saveSla() {
    if (!shop) return;
    setSavingSla(true); setSlaMsg("");
    const res = await fetch(`/api/shops/${shop.id}/settings`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ defaultSlaHours }) });
    setSlaMsg(res.ok ? "Saved." : "Failed."); setSavingSla(false);
    setTimeout(() => setSlaMsg(""), 3000);
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !shop) return;
    setUploadingLogo(true);
    const fd = new FormData(); fd.append("file", file); fd.append("tag", "logo");
    const res = await fetch(`/api/shops/${shop.id}/logo`, { method: "POST", credentials: "include", body: fd });
    if (res.ok) { const d = await res.json(); setShop(prev => prev ? { ...prev, logoUrl: d.url } : prev); }
    setUploadingLogo(false);
    if (logoRef.current) logoRef.current.value = "";
  }

  async function saveReceiptSize(size: string) {
    if (!shop) return;
    setSavingReceipt(true); setReceiptMsg("");
    const res = await fetch(`/api/shops/${shop.id}/settings`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ receiptSize: size }) });
    if (res.ok) { setReceiptSize(size); if (typeof window !== "undefined") localStorage.setItem("fixflow_receipt_size", size); setReceiptMsg("Saved."); }
    else setReceiptMsg("Failed.");
    setSavingReceipt(false); setTimeout(() => setReceiptMsg(""), 3000);
  }

  async function saveNotifPrefs() {
    setSavingNotifPrefs(true);
    const res = await fetch("/api/notifications/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(notifPrefs) });
    if (res.ok) { setNotifPrefsMsg("Saved."); setTimeout(() => setNotifPrefsMsg(""), 3000); }
    setSavingNotifPrefs(false);
  }

  async function saveSmsSettings() {
    if (!shop) return;
    setSavingNotif(true); setNotifMsg("");
    const res = await fetch(`/api/shops/${shop.id}/settings`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ smsEnabled, smsProvider, notifyStatuses: notifyStatuses.join(","), smsLanguage, includeTrackingLink }) });
    setNotifMsg(res.ok ? "Saved." : "Failed."); setSavingNotif(false);
    setTimeout(() => setNotifMsg(""), 3000);
  }

  async function saveWaTemplates() {
    if (!shop) return;
    setSavingWaTemplates(true); setWaTemplateMsg("");
    const res = await fetch(`/api/shops/${shop.id}/settings`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ waTemplateStatus, waTemplatePickup, waTemplateAppointment }) });
    setWaTemplateMsg(res.ok ? "Saved." : "Failed."); setSavingWaTemplates(false);
    setTimeout(() => setWaTemplateMsg(""), 3000);
  }

  async function sendTestSms() {
    if (!shop || !testPhone.trim()) return;
    setSendingTest(true); setTestMsg("");
    const res = await fetch(`/api/shops/${shop.id}/test-sms`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ phone: testPhone.trim() }) });
    const d = await res.json();
    setTestMsg(d.success ? "✅ Test message sent!" : `❌ ${d.error ?? "Failed"}`);
    setSendingTest(false);
  }

  async function saveTwilioSettings() {
    if (!shop) return;
    setSavingTwilio(true); setTwilioMsg("");
    const res = await fetch(`/api/shops/${shop.id}/settings`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ twilioSid, twilioToken, twilioPhone }) });
    setTwilioMsg(res.ok ? "Credentials saved." : "Failed."); setSavingTwilio(false);
    setTimeout(() => setTwilioMsg(""), 3000);
  }

  async function saveEmailSettings() {
    if (!shop) return;
    setSavingEmailSettings(true); setEmailSettingsMsg("");
    const res = await fetch(`/api/shops/${shop.id}/settings`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ emailEnabled, emailDomain, emailNotifyWelcome, emailNotifyStatus, emailNotifyPickup, emailNotifyAppt, emailNotifyReminder }) });
    setEmailSettingsMsg(res.ok ? "Saved." : "Failed."); setSavingEmailSettings(false);
    setTimeout(() => setEmailSettingsMsg(""), 3000);
  }

  async function sendTestEmail() {
    if (!testEmailAddress.trim()) return;
    setSendingTestEmail(true); setTestEmailMsg("");
    const res = await fetch("/api/notifications/email", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ type: "test", to: testEmailAddress.trim() }) });
    const d = await res.json();
    setTestEmailMsg(d.ok ? (d.message === "logged" ? "📋 Logged to console (no RESEND_API_KEY)" : "✅ Test email sent!") : `❌ ${d.message}`);
    setSendingTestEmail(false); setTimeout(() => setTestEmailMsg(""), 5000);
  }

  async function loadEmailPreview(key: string) {
    if (!shop) return;
    setLoadingPreview(true); setPreviewTemplate(key);
    const res = await fetch("/api/notifications/email", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ type: key, to: "preview@example.com", preview: true }) });
    const d = await res.json();
    setPreviewHtml(d.html ?? ""); setLoadingPreview(false);
  }

  async function saveAvailability() {
    if (!user?.shopId) return;
    setSavingAvail(true); setAvailMsg("");
    const res = await fetch(`/api/shops/${user.shopId}/availability`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ days, slotDurationMinutes: slotDuration, maxConcurrent }) });
    setAvailMsg(res.ok ? "Saved." : "Failed."); setSavingAvail(false);
    setTimeout(() => setAvailMsg(""), 3000);
  }

  async function addClosure() {
    if (!newClosureDate || !user?.shopId) return;
    setAddingClosure(true);
    const res = await fetch(`/api/shops/${user.shopId}/closures`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ date: newClosureDate, reason: newClosureReason }) });
    if (res.ok) { setNewClosureDate(""); setNewClosureReason(""); await loadClosures(); }
    setAddingClosure(false);
  }

  async function deleteClosure(id: string) {
    if (!user?.shopId) return;
    setDeletingClosureId(id);
    await fetch(`/api/shops/${user.shopId}/closures?closureId=${id}`, { method: "DELETE", credentials: "include" });
    setClosures(prev => prev.filter(c => c.id !== id));
    setDeletingClosureId(null);
  }

  async function createApiKey() {
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    const res = await fetch("/api/keys", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name: newKeyName.trim() }) });
    if (res.ok) { const created = await res.json(); setApiKeys(prev => [created, ...prev]); setNewKeyName(""); }
    setCreatingKey(false);
  }

  async function deleteApiKey(id: string) {
    if (!confirm("Delete this API key? Any integrations using it will stop working.")) return;
    setDeletingKeyId(id);
    await fetch(`/api/keys?id=${id}`, { method: "DELETE", credentials: "include" });
    setApiKeys(prev => prev.filter(k => k.id !== id));
    setDeletingKeyId(null);
  }

  function copyKey(key: ApiKey) {
    navigator.clipboard.writeText(key.key);
    setCopiedKeyId(key.id); setTimeout(() => setCopiedKeyId(null), 2000);
  }

  async function generateTvToken() {
    setGeneratingTvToken(true);
    const res = await fetch("/api/tv/token", { method: "POST", credentials: "include" });
    if (res.ok) { const d = await res.json(); setTvToken(d.tvToken); }
    setGeneratingTvToken(false);
  }

  function copyTvUrl() {
    if (!tvToken) return;
    const url = `${window.location.origin}/tv?token=${tvToken}`;
    navigator.clipboard.writeText(url);
    setTvTokenCopied(true);
    setTimeout(() => setTvTokenCopied(false), 2000);
  }

  async function saveImeiKey() {
    if (!shop) return;
    setSavingImeiKey(true); setImeiKeyMsg("");
    const res = await fetch(`/api/shops/${shop.id}/settings`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ imeiProApiKey }) });
    setImeiKeyMsg(res.ok ? "Saved." : "Failed."); setSavingImeiKey(false);
    setTimeout(() => setImeiKeyMsg(""), 3000);
  }

  async function saveCheckMendKey() {
    if (!shop) return;
    setSavingCheckMend(true); setCheckMendMsg("");
    const res = await fetch(`/api/shops/${shop.id}/settings`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ checkMendApiKey }) });
    setCheckMendMsg(res.ok ? "Saved." : "Failed."); setSavingCheckMend(false);
    setTimeout(() => setCheckMendMsg(""), 3000);
  }

  async function testImeiConnection() {
    if (!imeiProApiKey) { setImeiConnMsg("Enter an API key first."); return; }
    setTestingImeiConn(true); setImeiConnMsg("");
    try {
      const res = await fetch("/api/imei/check", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ imei: "353879234151890" }) });
      const d = await res.json();
      setImeiConnMsg(d.blacklist !== undefined ? "✅ IMEI Pro connection successful" : d.proError ? `❌ ${d.proError}` : "✅ Connected (basic validation only)");
    } catch { setImeiConnMsg("❌ Connection failed"); }
    setTestingImeiConn(false); setTimeout(() => setImeiConnMsg(""), 5000);
  }

  async function togglePerm(permission: string, enabled: boolean) {
    setSavingPerm(permission); setPermsMsg("");
    setEngineerPerms(prev => ({ ...prev, [permission]: enabled }));
    const res = await fetch("/api/permissions", { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ role: "ENGINEER", permission, enabled }) });
    if (!res.ok) { setEngineerPerms(prev => ({ ...prev, [permission]: !enabled })); setPermsMsg("Failed to save."); }
    else { setPermsMsg("Saved."); setTimeout(() => setPermsMsg(""), 2000); }
    setSavingPerm(null);
  }

  function toggleStatus(status: string) {
    setNotifyStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  }

  // ─── Derived ──────────────────────────────────────────────────────────────

  const daysLeft = shop?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(shop.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  const tabs: { key: Tab; label: string; Icon: React.FC<{ className?: string }>; adminOnly?: boolean }[] = [
    { key: "profile",       label: "Profile",       Icon: User },
    { key: "shop",          label: "Shop",           Icon: Store,     adminOnly: true },
    { key: "appearance",    label: "Appearance",     Icon: Palette },
    { key: "billing",       label: "Tax & Billing",  Icon: CreditCard, adminOnly: true },
    { key: "notifications", label: "Notifications",  Icon: Bell,      adminOnly: true },
    { key: "appointments",  label: "Appointments",   Icon: Calendar,  adminOnly: true },
    { key: "integrations",  label: "Integrations",   Icon: Puzzle,    adminOnly: true },
    { key: "permissions",   label: "Permissions",    Icon: Shield,    adminOnly: true },
  ];

  const visibleTabs = tabs.filter(t => !t.adminOnly || user?.role === "ADMIN");

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account, shop configuration, and integrations</p>
      </div>

      {/* Trial / plan banner */}
      {shop && shop.status === "TRIAL" && daysLeft !== null && daysLeft <= 7 && (
        <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm ${daysLeft <= 2 ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300" : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300"}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{daysLeft} day{daysLeft !== 1 ? "s" : ""} left in your trial</span>
          </div>
          <button onClick={() => { setTab("billing"); setUpgradePlanKey("PRO"); setShowUpgradeModal(true); }}
            className="text-xs font-semibold underline underline-offset-2 whitespace-nowrap">Upgrade now</button>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-1 flex-wrap bg-slate-100 dark:bg-slate-800/60 rounded-xl p-1">
        {visibleTabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-lg transition-colors ${tab === t.key ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white"}`}>
            <t.Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Profile ────────────────────────────────────────────────────── */}
      {tab === "profile" && (
        <div className="space-y-4">
          <div className={`${CARD} p-5 space-y-4`}>
            <SectionHeader title="Personal Information" description="Update your display name and email address. Your email is used for login and notifications." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Full name</label>
                <input value={name} onChange={e => setName(e.target.value)} className={INPUT} placeholder="Your name" />
              </div>
              <div>
                <label className={LABEL}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={INPUT} placeholder="you@example.com" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-slate-500">Role:</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{user?.role}</span>
            </div>
            {profileMsg && <InlineMsg msg={profileMsg} />}
            {profileError && <InlineMsg msg={`❌ ${profileError}`} />}
            <button onClick={saveProfile} disabled={savingProfile} className={BTN_PRIMARY}>
              {savingProfile ? "Saving…" : "Save Profile"}
            </button>
          </div>

          <div className={`${CARD} p-5 space-y-4`}>
            <SectionHeader title="Change Password" description="Choose a strong password of at least 6 characters. You'll need to enter your current password to confirm." />
            <div>
              <label className={LABEL}>Current password</label>
              <div className="relative">
                <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={INPUT} placeholder="Current password" />
                <button type="button" onClick={() => setShowCurrent(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>New password</label>
                <div className="relative">
                  <input type={showNew ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} className={INPUT} placeholder="New password" />
                  <button type="button" onClick={() => setShowNew(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={LABEL}>Confirm new password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={INPUT} placeholder="Repeat new password" />
              </div>
            </div>
            {pwMsg && <InlineMsg msg={pwMsg} />}
            {pwError && <InlineMsg msg={`❌ ${pwError}`} />}
            <button onClick={savePassword} disabled={savingPw} className={BTN_PRIMARY}>
              {savingPw ? "Saving…" : "Change Password"}
            </button>
          </div>
        </div>
      )}

      {/* ── Shop ────────────────────────────────────────────────────────── */}
      {tab === "shop" && (
        <div className="space-y-4">
          {/* Logo */}
          <div className={`${CARD} p-5`}>
            <SectionHeader title="Shop Logo" description="Upload a square logo (PNG or JPG). It appears on receipts, the customer portal, and email notifications." />
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-800 flex-shrink-0">
                {shop?.logoUrl ? <img src={shop.logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <Store className="w-6 h-6 text-slate-400" />}
              </div>
              <div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
                <button onClick={() => logoRef.current?.click()} disabled={uploadingLogo} className={BTN_SECONDARY}>
                  {uploadingLogo ? "Uploading…" : "Upload Logo"}
                </button>
                <p className="text-xs text-slate-400 mt-1">PNG or JPG, square recommended</p>
              </div>
            </div>
          </div>

          {/* Basic info */}
          <div className={`${CARD} p-5 space-y-4`}>
            <SectionHeader title="Shop Information" description="This information is shown to customers on the booking page and repair tracking portal." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={LABEL}>Shop name</label>
                <input value={shopForm.name} onChange={e => setShopForm(p => ({ ...p, name: e.target.value }))} className={INPUT} placeholder="Your shop name" />
              </div>
              <div>
                <label className={LABEL}>Phone number</label>
                <input value={shopForm.phone} onChange={e => setShopForm(p => ({ ...p, phone: e.target.value }))} className={INPUT} placeholder="+212600000000" />
              </div>
              <div>
                <label className={LABEL}>WhatsApp number</label>
                <input value={shopForm.whatsappPhone} onChange={e => setShopForm(p => ({ ...p, whatsappPhone: e.target.value }))} className={INPUT} placeholder="+212600000000" />
              </div>
              <div>
                <label className={LABEL}>Email address</label>
                <input type="email" value={shopForm.email} onChange={e => setShopForm(p => ({ ...p, email: e.target.value }))} className={INPUT} placeholder="shop@example.com" />
              </div>
              <div>
                <label className={LABEL}>Google Maps URL</label>
                <input value={shopForm.googleMapsUrl} onChange={e => setShopForm(p => ({ ...p, googleMapsUrl: e.target.value }))} className={INPUT} placeholder="https://maps.google.com/..." />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>Address</label>
                <input value={shopForm.address} onChange={e => setShopForm(p => ({ ...p, address: e.target.value }))} className={INPUT} placeholder="Street address" />
              </div>
              <div>
                <label className={LABEL}>City</label>
                <input value={shopForm.city} onChange={e => setShopForm(p => ({ ...p, city: e.target.value }))} className={INPUT} placeholder="City" />
              </div>
              <div>
                <label className={LABEL}>Country</label>
                <input value={shopForm.country} onChange={e => setShopForm(p => ({ ...p, country: e.target.value }))} className={INPUT} placeholder="Country" />
              </div>
              <div>
                <label className={LABEL}>Latitude</label>
                <input value={shopForm.lat} onChange={e => setShopForm(p => ({ ...p, lat: e.target.value }))} className={INPUT} placeholder="33.5731" />
              </div>
              <div>
                <label className={LABEL}>Longitude</label>
                <input value={shopForm.lng} onChange={e => setShopForm(p => ({ ...p, lng: e.target.value }))} className={INPUT} placeholder="-7.5898" />
              </div>
            </div>
            {shopMsg && <InlineMsg msg={shopMsg} />}
            <button onClick={saveShop} disabled={savingShop} className={BTN_PRIMARY}>
              {savingShop ? "Saving…" : "Save Shop Info"}
            </button>
          </div>

          {/* SLA */}
          <div className={`${CARD} p-5 space-y-4`}>
            <SectionHeader title="Default SLA" description="New work orders are automatically assigned a deadline based on this setting. Used to flag overdue repairs." />
            <div className="flex items-center gap-3">
              <div className="w-32">
                <label className={LABEL}>Hours</label>
                <input type="number" min={1} max={720} value={defaultSlaHours} onChange={e => setDefaultSlaHours(Number(e.target.value))} className={INPUT} />
              </div>
              <p className="text-sm text-slate-500 mt-4">hours after receipt</p>
            </div>
            {slaMsg && <InlineMsg msg={slaMsg} />}
            <button onClick={saveSla} disabled={savingSla} className={BTN_PRIMARY}>
              {savingSla ? "Saving…" : "Save SLA"}
            </button>
          </div>
        </div>
      )}

      {/* ── Appearance ──────────────────────────────────────────────────── */}
      {tab === "appearance" && (
        <div className="space-y-4">
          <div className={`${CARD} p-5 space-y-5`}>
            <SectionHeader title="Display Preferences" description="Customize how FixFlow looks and feels. These settings are saved per device." />

            {/* Dark mode */}
            <RowToggle label="Dark mode" description={theme === "dark" ? "Dark theme active" : "Light theme active"} value={theme === "dark"} onChange={() => toggle()} />

            <Divider />

            {/* Language */}
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-3">Interface language</p>
              <div className="grid grid-cols-3 gap-2">
                {([["en", "English"], ["fr", "Français"], ["ar", "العربية"]] as [Lang, string][]).map(([l, label]) => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${lang === l ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400 hover:text-slate-900 dark:hover:text-white"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Divider />

            {/* Currency */}
            <div>
              <label className={LABEL}>Currency</label>
              <select value={shopForm.currency} onChange={e => setShopForm(p => ({ ...p, currency: e.target.value }))} className={INPUT}>
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <p className="text-xs text-slate-400 mt-1">Save in the Shop tab to apply currency changes.</p>
            </div>
          </div>

          {/* Onboarding tour */}
          <div className={`${CARD} p-5 flex items-center justify-between`}>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Onboarding Tour</p>
              <p className="text-xs text-slate-500 mt-0.5">Replay the guided walkthrough of FixFlow</p>
            </div>
            <button onClick={() => { try { localStorage.removeItem(`fixflow_tour_v1_${user?.id ?? ""}`); } catch { /* noop */ } window.dispatchEvent(new CustomEvent("fixflow:start-tour")); }}
              className={BTN_SECONDARY}>
              ▶ Replay Tour
            </button>
          </div>

          {/* Receipt size */}
          <div className={`${CARD} p-5 space-y-3`}>
            <SectionHeader title="Receipt Printing" description="Set the default paper size for thermal receipts. Thermal printers work without special drivers — just set as default printer in your OS." />
            {receiptMsg && <InlineMsg msg={receiptMsg} />}
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "A4",         label: "A4",           sub: "Standard paper",   icon: "📄" },
                { key: "THERMAL_80", label: "Thermal 80mm", sub: "Most common roll",  icon: "🧾" },
                { key: "THERMAL_58", label: "Thermal 58mm", sub: "Compact roll",      icon: "🧾" },
              ] as const).map(opt => (
                <button key={opt.key} onClick={() => saveReceiptSize(opt.key)} disabled={savingReceipt}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${receiptSize === opt.key ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}>
                  <span className="text-xl">{opt.icon}</span>
                  <p className={`text-xs font-semibold ${receiptSize === opt.key ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}`}>{opt.label}</p>
                  <p className="text-xs text-slate-400">{opt.sub}</p>
                  {receiptSize === opt.key && <span className="text-xs text-blue-500 font-bold">✓ Active</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Social share */}
          <div className={`${CARD} p-5`}>
            <SectionHeader title="Social Share Cards" description="Customize the repair status images shared on WhatsApp and social media." />
            <SocialSharingSettings />
          </div>

          {/* In-app notification prefs */}
          <div className={`${CARD} p-5 space-y-4`}>
            <SectionHeader title="In-App Notification Preferences" description="Choose which internal alerts you receive in the notification bell. These only affect your account." />
            {notifPrefsMsg && <InlineMsg msg={notifPrefsMsg} />}
            <div className="space-y-1">
              {([
                ["newMessage",     "💬", "New customer message",  "Customer sends a message on a work order"],
                ["lowStock",       "📦", "Low stock alert",       "Part stock drops to 5 or below"],
                ["newAppointment", "📅", "New appointment",       "A customer books via the booking page"],
                ["slaBreach",      "⚠️", "SLA breach warning",    "Order deadline within 2 hours"],
                ["orderOverdue",   "🕐", "Order overdue",         "Open order older than 7 days"],
                ["certification",  "🏆", "Certification update",  "Shop earns or upgrades a certification level"],
                ["newRating",      "⭐", "New rating received",   "Customer submits a satisfaction rating"],
              ] as [string, string, string, string][]).map(([key, icon, label, desc]) => (
                <RowToggle key={key} label={`${icon} ${label}`} description={desc} value={notifPrefs[key] ?? true} onChange={v => setNotifPrefs(p => ({ ...p, [key]: v }))} />
              ))}
            </div>
            <button onClick={saveNotifPrefs} disabled={savingNotifPrefs} className={BTN_PRIMARY}>
              {savingNotifPrefs ? "Saving…" : "Save Preferences"}
            </button>
          </div>
        </div>
      )}

      {/* ── Tax & Billing ────────────────────────────────────────────────── */}
      {tab === "billing" && (
        <div className="space-y-4">
          <div className={`${CARD} p-5 space-y-4`}>
            <SectionHeader title="Tax Settings" description="Configure VAT or other taxes. When enabled, tax is added to invoice totals and shown separately on receipts." />
            <RowToggle label="Enable tax on invoices" description="Adds a tax line to all work order invoices" value={shopForm.taxEnabled} onChange={v => setShopForm(p => ({ ...p, taxEnabled: v }))} />
            {shopForm.taxEnabled && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className={LABEL}>Tax rate (%)</label>
                  <input type="number" min={0} max={100} step={0.1} value={shopForm.taxRate} onChange={e => setShopForm(p => ({ ...p, taxRate: parseFloat(e.target.value) }))} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Tax label</label>
                  <input value={shopForm.taxLabel} onChange={e => setShopForm(p => ({ ...p, taxLabel: e.target.value }))} className={INPUT} placeholder="TVA" />
                </div>
              </div>
            )}
            {shopMsg && <InlineMsg msg={shopMsg} />}
            <button onClick={saveShop} disabled={savingShop} className={BTN_PRIMARY}>
              {savingShop ? "Saving…" : "Save Tax Settings"}
            </button>
          </div>

          <div className={`${CARD} p-5 space-y-4`}>
            <SectionHeader title="Current Plan" description="Your active subscription. Upgrade to unlock more users, branches, email notifications, and API access." />
            {billingData ? (
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{billingData.currentPlan} Plan</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${billingData.status === "ACTIVE" ? "bg-green-500/20 text-green-600 dark:text-green-400" : billingData.status === "TRIAL" ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" : "bg-red-500/20 text-red-600 dark:text-red-400"}`}>{billingData.status}</span>
                  </div>
                  {billingData.trialEndsAt && <p className="text-xs text-slate-500">Trial ends {new Date(billingData.trialEndsAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>}
                  {billingData.stripePlanSelected && billingData.stripePlanSelected !== billingData.currentPlan && <p className="text-xs text-blue-500 mt-1">Upgrade to <strong>{billingData.stripePlanSelected}</strong> pending billing launch</p>}
                </div>
                {billingData.currentPlan !== "ENTERPRISE" && (
                  <button onClick={() => { setUpgradePlanKey("PRO"); setShowUpgradeModal(true); }} className={BTN_PRIMARY}>
                    Upgrade Plan
                  </button>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-400 py-4 text-center">Loading…</div>
            )}
            <Divider />
            <div className="space-y-2">
              {[
                { key: "FREE",       name: "Starter",    price: "Free",    features: "50 orders/mo · 1 user · Basic reports" },
                { key: "PRO",        name: "Pro",         price: "$29/mo",  features: "Unlimited · 10 users · Email + SMS · Multi-branch · API", highlight: true },
                { key: "ENTERPRISE", name: "Enterprise", price: "$79/mo",  features: "Unlimited everything · White-label · Dedicated support" },
              ].map(plan => (
                <div key={plan.key} className={`flex items-center justify-between p-3 rounded-xl border ${(plan as { highlight?: boolean }).highlight ? "border-blue-400/50 bg-blue-50/50 dark:bg-blue-950/20" : billingData?.currentPlan === plan.key ? "border-green-400/50 bg-green-50/50 dark:bg-green-950/20" : "border-slate-200 dark:border-slate-700"}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{plan.name}</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{plan.price}</span>
                      {billingData?.currentPlan === plan.key && <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium">Current</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{plan.features}</p>
                  </div>
                  {billingData?.currentPlan !== plan.key && plan.key !== "FREE" && (
                    <button onClick={() => { setUpgradePlanKey(plan.key); setShowUpgradeModal(true); }}
                      className="ml-4 px-3 py-1.5 border border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap">
                      {plan.key === "ENTERPRISE" ? "Contact" : "Upgrade"}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <a href="/pricing" target="_blank" className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline">
              View full pricing page <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* ── Notifications ────────────────────────────────────────────────── */}
      {tab === "notifications" && (
        <div className="space-y-4">
          {/* SMS/WhatsApp */}
          <div className={`${CARD} p-5 space-y-4`}>
            <SectionHeader title="Customer SMS & WhatsApp" description="Automatically notify customers when their repair status changes. Requires a Twilio account or works in test mode (logs only)." />
            <RowToggle label="Enable customer notifications" description="Send automatic status updates to customers" value={smsEnabled} onChange={setSmsEnabled} />

            {smsEnabled && (
              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div>
                  <label className={LABEL}>Channel</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([["twilio_sms", "📱 SMS", "Twilio SMS"], ["twilio_whatsapp", "💬 WhatsApp", "Twilio WA"], ["mock", "🧪 Test mode", "Logs only"]] as const).map(([v, l, d]) => (
                      <button key={v} onClick={() => setSmsProvider(v)}
                        className={`px-3 py-2.5 rounded-xl border text-left transition-colors ${smsProvider === v ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{l}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{d}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Notify on these statuses</label>
                  <div className="flex flex-wrap gap-2">
                    {["RECEIVED","IN_PROGRESS","DONE","DELIVERED","CANCELLED"].map(s => (
                      <button key={s} onClick={() => toggleStatus(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${notifyStatuses.includes(s) ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>SMS language</label>
                    <select value={smsLanguage} onChange={e => setSmsLanguage(e.target.value)} className={INPUT}>
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                      <option value="ar">العربية</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <RowToggle label="Include tracking link" value={includeTrackingLink} onChange={setIncludeTrackingLink} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <input value={testPhone} onChange={e => setTestPhone(e.target.value)} className={INPUT} placeholder="Test phone number (+212...)" />
                  <button onClick={sendTestSms} disabled={sendingTest || !testPhone.trim()} className={BTN_SECONDARY + " whitespace-nowrap"}>
                    {sendingTest ? "Sending…" : "Send test"}
                  </button>
                </div>
                {testMsg && <InlineMsg msg={testMsg} />}
              </div>
            )}

            {notifMsg && <InlineMsg msg={notifMsg} />}
            <button onClick={saveSmsSettings} disabled={savingNotif} className={BTN_PRIMARY}>
              {savingNotif ? "Saving…" : "Save SMS Settings"}
            </button>
          </div>

          {/* Twilio credentials */}
          <div className={`${CARD} p-5 space-y-4`}>
            <SectionHeader title="Twilio Credentials" description="Enter your Twilio credentials to send real SMS and WhatsApp messages. Without these, only test-mode logging works." />
            {twilioSid && twilioToken && (
              <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-lg px-3 py-2">
                <CheckCircle className="w-3.5 h-3.5" /><span>Twilio configured — SMS/WhatsApp active</span>
              </div>
            )}
            {twilioMsg && <InlineMsg msg={twilioMsg} />}
            <div className="space-y-3">
              <div>
                <label className={LABEL}>Account SID</label>
                <input type="text" value={twilioSid} onChange={e => setTwilioSid(e.target.value)} className={INPUT} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
              </div>
              <div>
                <label className={LABEL}>Auth Token</label>
                <input type="password" value={twilioToken} onChange={e => setTwilioToken(e.target.value)} className={INPUT} placeholder="••••••••••••••••••••••••••••••••" />
              </div>
              <div>
                <label className={LABEL}>Phone number</label>
                <input type="text" value={twilioPhone} onChange={e => setTwilioPhone(e.target.value)} className={INPUT} placeholder="+1234567890 or whatsapp:+1234567890" />
                <p className="text-xs text-slate-400 mt-1">Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">whatsapp:+...</code> prefix for WhatsApp</p>
              </div>
            </div>
            <button onClick={saveTwilioSettings} disabled={savingTwilio} className={BTN_PRIMARY}>
              {savingTwilio ? "Saving…" : "Save Twilio Credentials"}
            </button>
          </div>

          {/* WhatsApp templates */}
          <div className={`${CARD} p-5 space-y-4`}>
            <SectionHeader title="Message Templates" description="Customize the message text sent to customers. Leave blank to use the built-in defaults. Use {name}, {device}, {order} as variables." />
            {waTemplateMsg && <InlineMsg msg={waTemplateMsg} />}
            {([
              ["waTemplateStatus", waTemplateStatus, setWaTemplateStatus, DEFAULT_TEMPLATES.statusUpdate, "Status update message"],
              ["waTemplatePickup", waTemplatePickup, setWaTemplatePickup, DEFAULT_TEMPLATES.readyPickup, "Ready for pickup message"],
              ["waTemplateAppointment", waTemplateAppointment, setWaTemplateAppointment, DEFAULT_TEMPLATES.appointment, "Appointment confirmation"],
            ] as [string, string, (v: string) => void, string, string][]).map(([, val, setter, placeholder, label]) => (
              <div key={label}>
                <label className={LABEL}>{label}</label>
                <textarea value={val} onChange={e => setter(e.target.value)} rows={3}
                  className={INPUT + " resize-none"} placeholder={`${placeholder} (default)`} />
              </div>
            ))}
            <button onClick={saveWaTemplates} disabled={savingWaTemplates} className={BTN_PRIMARY}>
              {savingWaTemplates ? "Saving…" : "Save Templates"}
            </button>
          </div>

          {/* Email notifications */}
          <div className={`${CARD} p-5 space-y-4`}>
            <SectionHeader title="Email Notifications" description="Send automated HTML emails to customers via Resend. Requires a RESEND_API_KEY environment variable and a verified sending domain." />
            {!resendConfigured && (
              <div className="flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 rounded-lg px-3 py-2.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <div><strong>Inactive</strong> — add <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">RESEND_API_KEY</code> environment variable and a verified domain to activate.</div>
              </div>
            )}
            <RowToggle label="Enable email notifications" description="Send transactional emails to customers" value={emailEnabled} onChange={setEmailEnabled} />
            <div>
              <label className={LABEL}>Sending domain</label>
              <input value={emailDomain} onChange={e => setEmailDomain(e.target.value)} className={INPUT} placeholder="yourshop.com (must be verified in Resend)" />
              <p className="text-xs text-slate-400 mt-1">Emails sent from <code>noreply@{emailDomain || "yourdomain.com"}</code></p>
            </div>
            <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-3">
              {([
                [emailNotifyWelcome,  setEmailNotifyWelcome,  "Welcome / Order received"],
                [emailNotifyStatus,   setEmailNotifyStatus,   "Status updates"],
                [emailNotifyPickup,   setEmailNotifyPickup,   "Ready for pickup"],
                [emailNotifyAppt,     setEmailNotifyAppt,     "Appointment confirmation"],
                [emailNotifyReminder, setEmailNotifyReminder, "Appointment reminder (24h before)"],
              ] as [boolean, (v: boolean) => void, string][]).map(([val, setter, label]) => (
                <RowToggle key={label} label={label} value={val} onChange={setter} />
              ))}
            </div>
            {emailSettingsMsg && <InlineMsg msg={emailSettingsMsg} />}
            <button onClick={saveEmailSettings} disabled={savingEmailSettings} className={BTN_PRIMARY}>
              {savingEmailSettings ? "Saving…" : "Save Email Settings"}
            </button>

            {/* Test send + previews */}
            <Divider />
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Test & Preview</p>
              <div className="flex gap-2">
                <input type="email" value={testEmailAddress} onChange={e => setTestEmailAddress(e.target.value)} className={INPUT} placeholder="Send test to this email" />
                <button onClick={sendTestEmail} disabled={sendingTestEmail || !testEmailAddress.trim()} className={BTN_SECONDARY + " whitespace-nowrap"}>
                  {sendingTestEmail ? "Sending…" : "Send test"}
                </button>
              </div>
              {testEmailMsg && <InlineMsg msg={testEmailMsg} />}
              <div className="grid grid-cols-3 gap-2">
                {[{ key: "welcome", label: "Welcome", icon: "👋" }, { key: "status", label: "Status", icon: "🔄" }, { key: "pickup", label: "Pickup", icon: "🎉" }, { key: "appointment", label: "Appt", icon: "📅" }, { key: "reminder", label: "Reminder", icon: "🔔" }, { key: "password", label: "Password", icon: "🔐" }].map(t => (
                  <button key={t.key} onClick={() => loadEmailPreview(t.key)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-xs font-medium text-slate-700 dark:text-slate-300 transition-all">
                    <span>{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview modal */}
          {previewTemplate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Email Preview — {previewTemplate}</h3>
                  <button onClick={() => { setPreviewTemplate(null); setPreviewHtml(""); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  {loadingPreview ? <div className="text-center py-16 text-sm text-slate-400">Loading…</div> : <iframe srcDoc={previewHtml} className="w-full h-[600px] rounded-lg border border-slate-200 dark:border-slate-700" title="Email preview" />}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Appointments ─────────────────────────────────────────────────── */}
      {tab === "appointments" && (
        <div className="space-y-4">
          <div className={`${CARD} p-5 space-y-4`}>
            <SectionHeader title="Working Hours" description="Set when your shop is open each day. Customers can only book appointments during these hours." />
            <div className="space-y-2">
              {days.map(day => (
                <div key={day.dayOfWeek} className={`flex items-center gap-3 py-2 ${!day.isOpen ? "opacity-50" : ""}`}>
                  <Toggle value={day.isOpen} onChange={v => setDays(prev => prev.map(d => d.dayOfWeek === day.dayOfWeek ? { ...d, isOpen: v } : d))} />
                  <span className="text-sm font-medium text-slate-900 dark:text-white w-24 flex-shrink-0">{DAY_NAMES[day.dayOfWeek]}</span>
                  {day.isOpen ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="time" value={day.openTime} onChange={e => setDays(prev => prev.map(d => d.dayOfWeek === day.dayOfWeek ? { ...d, openTime: e.target.value } : d))}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                      <span className="text-slate-400 text-sm">–</span>
                      <input type="time" value={day.closeTime} onChange={e => setDays(prev => prev.map(d => d.dayOfWeek === day.dayOfWeek ? { ...d, closeTime: e.target.value } : d))}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Closed</span>
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className={LABEL}>Slot duration (minutes)</label>
                <select value={slotDuration} onChange={e => setSlotDuration(Number(e.target.value))} className={INPUT}>
                  {[15,30,45,60,90,120].map(m => <option key={m} value={m}>{m} min</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Max concurrent appointments</label>
                <input type="number" min={1} max={20} value={maxConcurrent} onChange={e => setMaxConcurrent(Number(e.target.value))} className={INPUT} />
              </div>
            </div>
            {availMsg && <InlineMsg msg={availMsg} />}
            <button onClick={saveAvailability} disabled={savingAvail} className={BTN_PRIMARY}>
              {savingAvail ? "Saving…" : "Save Working Hours"}
            </button>
          </div>

          <div className={`${CARD} p-5 space-y-4`}>
            <SectionHeader title="Closed Dates" description="Mark specific dates when your shop is closed. Customers won't be able to book appointments on these days." />
            <div className="flex gap-2">
              <input type="date" value={newClosureDate} onChange={e => setNewClosureDate(e.target.value)} className={INPUT} />
              <input value={newClosureReason} onChange={e => setNewClosureReason(e.target.value)} className={INPUT} placeholder="Reason (optional)" />
              <button onClick={addClosure} disabled={addingClosure || !newClosureDate} className={BTN_PRIMARY + " whitespace-nowrap"}>
                {addingClosure ? "Adding…" : <><Plus className="w-4 h-4" /> Add</>}
              </button>
            </div>
            {closures.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-3">No closed dates set</p>
            ) : (
              <div className="space-y-2">
                {closures.map(c => (
                  <div key={c.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <p className="text-sm text-slate-900 dark:text-white">{new Date(c.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</p>
                      {c.reason && <p className="text-xs text-slate-400">{c.reason}</p>}
                    </div>
                    <button onClick={() => deleteClosure(c.id)} disabled={deletingClosureId === c.id} className={BTN_DANGER}>
                      {deletingClosureId === c.id ? "…" : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Booking link */}
          {shop && (
            <div className={`${CARD} p-5`}>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Booking Link</p>
              <p className="text-xs text-slate-500 mb-3">Share this link so customers can book appointments online.</p>
              <div className="flex gap-2">
                <input readOnly value={`https://fixflow-ruddy.vercel.app/book/${shop.id}`} className={INPUT + " font-mono text-xs"} />
                <button onClick={() => navigator.clipboard.writeText(`https://fixflow-ruddy.vercel.app/book/${shop.id}`)}
                  className={BTN_SECONDARY + " whitespace-nowrap"}>
                  <Copy className="w-4 h-4" /> Copy
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Integrations ─────────────────────────────────────────────────── */}
      {tab === "integrations" && (
        <div className="space-y-4">
          {/* API Keys */}
          <div className={`${CARD} p-5 space-y-4`}>
            <SectionHeader title="API Keys" description="API keys allow the FixFlow Diagnostics desktop app and other external tools to connect to your shop. Each key has full access to create and read work orders. Keep them secret — never share publicly." />
            <div className="flex gap-2">
              <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} className={INPUT} placeholder="Key name (e.g. Diagnostics App)" onKeyDown={e => e.key === "Enter" && createApiKey()} />
              <button onClick={createApiKey} disabled={creatingKey || !newKeyName.trim()} className={BTN_PRIMARY + " whitespace-nowrap"}>
                {creatingKey ? "Creating…" : <><Plus className="w-4 h-4" /> Create Key</>}
              </button>
            </div>

            {apiKeys.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <Key className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No API keys yet. Create one above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {apiKeys.map(key => (
                  <div key={key.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{key.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${key.isActive ? "bg-green-500/20 text-green-600 dark:text-green-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>{key.isActive ? "Active" : "Inactive"}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                          <span>Created {new Date(key.createdAt).toLocaleDateString("en-GB")}</span>
                          {key.lastUsed && <span>Last used {new Date(key.lastUsed).toLocaleDateString("en-GB")}</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteApiKey(key.id)} disabled={deletingKeyId === key.id} className={BTN_DANGER + " flex-shrink-0"}>
                        {deletingKeyId === key.id ? "…" : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                      <code className="text-xs font-mono text-slate-600 dark:text-slate-300 flex-1 truncate">{key.key}</code>
                      <button onClick={() => copyKey(key)} className="flex-shrink-0 text-slate-400 hover:text-blue-500 transition-colors">
                        {copiedKeyId === key.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <a href="/api-docs" target="_blank" className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:underline font-medium">
              <ExternalLink className="w-3.5 h-3.5" /> View API Documentation
            </a>
          </div>

          {/* IMEI Services */}
          <div className={`${CARD} p-5 space-y-5`}>
            <SectionHeader title="IMEI & Device Verification" description="Connect a third-party IMEI verification service to check if devices are stolen or blacklisted before accepting them for repair." />

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {[
                { name: "Free (Luhn)", cost: "Free", coverage: "Format check only", active: true },
                { name: "IMEI Pro", cost: "from $0.50/check", coverage: "Global blacklist", active: !!imeiProApiKey },
                { name: "CheckMEND", cost: "Custom pricing", coverage: "Police + insurer DB", active: !!checkMendApiKey },
              ].map(s => (
                <div key={s.name} className={`rounded-xl p-3 border ${s.active ? "border-green-300 dark:border-green-700/50 bg-green-50 dark:bg-green-950/20" : "border-slate-200 dark:border-slate-700"}`}>
                  {s.active && <CheckCircle className="w-3.5 h-3.5 text-green-500 mx-auto mb-1" />}
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{s.name}</p>
                  <p className="text-slate-500 mt-0.5">{s.cost}</p>
                  <p className="text-slate-400">{s.coverage}</p>
                </div>
              ))}
            </div>

            <Divider />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">IMEI Pro</p>
                  <p className="text-xs text-slate-500">Full stolen device blacklist — <a href="https://imeicheck.net" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">imeicheck.net</a></p>
                </div>
                {imeiProApiKey && <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded-full font-semibold">✓ Active</span>}
              </div>
              <div className="flex gap-2">
                <input type="password" value={imeiProApiKey} onChange={e => setImeiProApiKey(e.target.value)}
                  placeholder={imeiProApiKey ? "••••••••••••••••" : "Enter API key"} className={INPUT} />
                <button onClick={saveImeiKey} disabled={savingImeiKey} className={BTN_PRIMARY + " whitespace-nowrap"}>
                  {savingImeiKey ? "…" : "Save"}
                </button>
                {imeiProApiKey && (
                  <button onClick={() => { setImeiProApiKey(""); saveImeiKey(); }} className={BTN_DANGER + " whitespace-nowrap"}>
                    Remove
                  </button>
                )}
              </div>
              {imeiProApiKey && (
                <button onClick={testImeiConnection} disabled={testingImeiConn} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                  <RefreshCw className={`w-3.5 h-3.5 ${testingImeiConn ? "animate-spin" : ""}`} />
                  {testingImeiConn ? "Testing…" : "Test connection"}
                </button>
              )}
              {imeiKeyMsg && <InlineMsg msg={imeiKeyMsg} />}
              {imeiConnMsg && <InlineMsg msg={imeiConnMsg} />}
            </div>

            <Divider />

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">CheckMEND</p>
                <p className="text-xs text-slate-500">Popular in UK and EU markets. Police + insurance database. Integration coming soon — save your key now.</p>
              </div>
              <div className="flex gap-2">
                <input type="password" value={checkMendApiKey} onChange={e => setCheckMendApiKey(e.target.value)}
                  placeholder={checkMendApiKey ? "••••••••••••••••" : "Enter CheckMEND API key"} className={INPUT} />
                <button onClick={saveCheckMendKey} disabled={savingCheckMend} className={BTN_PRIMARY + " whitespace-nowrap"}>
                  {savingCheckMend ? "…" : "Save"}
                </button>
                {checkMendApiKey && (
                  <button onClick={() => { setCheckMendApiKey(""); saveCheckMendKey(); }} className={BTN_DANGER + " whitespace-nowrap"}>
                    Remove
                  </button>
                )}
              </div>
              {checkMendMsg && <InlineMsg msg={checkMendMsg} />}
              {checkMendApiKey && <p className="text-xs text-blue-500 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Key saved — activates automatically when CheckMEND integration launches</p>}
            </div>
          </div>

          {/* TV Display */}
          <div className={`${CARD} p-5 space-y-4`}>
            <SectionHeader title="TV Display Mode" description="Show a live repair status dashboard on a large screen or TV. No login required — access is protected by a unique token URL." />
            {loadingTvToken ? (
              <p className="text-sm text-slate-400">Loading…</p>
            ) : tvToken ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-lg px-3 py-2">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /><span>TV token active — anyone with this URL can view the display</span>
                </div>
                <div>
                  <label className={LABEL}>TV Display URL</label>
                  <div className="flex gap-2">
                    <input readOnly value={`${typeof window !== "undefined" ? window.location.origin : ""}/tv?token=${tvToken}`} className={INPUT + " font-mono text-xs"} />
                    <button onClick={copyTvUrl} className={BTN_SECONDARY + " whitespace-nowrap"}>
                      {tvTokenCopied ? <><Check className="w-4 h-4 text-green-500" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy URL</>}
                    </button>
                    <button onClick={() => window.open(`/tv?token=${tvToken}`, "_blank")} className={BTN_PRIMARY + " whitespace-nowrap"}>
                      <ExternalLink className="w-4 h-4" /> Open
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">Open this URL in a browser on any TV, tablet, or monitor. No login required.</p>
                </div>
                <button onClick={generateTvToken} disabled={generatingTvToken}
                  className="text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 transition-colors">
                  <RefreshCw className={`w-3.5 h-3.5 ${generatingTvToken ? "animate-spin" : ""}`} />
                  {generatingTvToken ? "Regenerating…" : "Regenerate token (invalidates old URL)"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">No TV token yet. Generate one to enable the TV display mode.</p>
                <button onClick={generateTvToken} disabled={generatingTvToken} className={BTN_PRIMARY}>
                  {generatingTvToken ? "Generating…" : <><Key className="w-4 h-4" /> Generate TV Token</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Permissions ──────────────────────────────────────────────────── */}
      {tab === "permissions" && (
        <div className="space-y-4">
          {user?.role !== "ADMIN" ? (
            <div className={`${CARD} p-5`}>
              <p className="text-sm text-slate-500 text-center py-8">Only admins can manage permissions.</p>
            </div>
          ) : (
            <>
              <div className={`${CARD} p-5 space-y-4`}>
                <div className="flex items-start justify-between gap-4">
                  <SectionHeader title="Engineer Permissions" description="Control what engineers can access and do in FixFlow. Admins always have full access. Changes take effect within 30 seconds." />
                  {permsMsg && <span className="text-xs text-green-600 dark:text-green-400 font-medium whitespace-nowrap">{permsMsg}</span>}
                </div>

                {loadingPerms ? (
                  <div className="text-center py-8 text-sm text-slate-400">Loading…</div>
                ) : (
                  <div className="space-y-6">
                    {[
                      { label: "Work Orders", perms: [["VIEW_ALL_ORDERS", "View all work orders", "See all orders, not just assigned ones"], ["VIEW_ASSIGNED_ORDERS_ONLY", "View assigned orders only", "Restrict to orders they're assigned to"], ["CREATE_ORDERS", "Create work orders", "Submit new repair jobs"], ["EDIT_ORDERS", "Edit work orders", "Modify existing order details"], ["DELETE_ORDERS", "Delete work orders", "Permanently remove orders"]] },
                      { label: "Financials", perms: [["VIEW_FINANCIALS", "View financial data", "See prices, payments, and totals"], ["EDIT_QUOTATION", "Edit quotations", "Modify line items and pricing"], ["RECORD_PAYMENTS", "Record payments", "Mark payments as collected"]] },
                      { label: "Customers", perms: [["VIEW_CUSTOMERS", "View customer list", "Access the customers section"], ["EDIT_CUSTOMERS", "Edit customer data", "Modify customer notes and info"]] },
                      { label: "Inventory", perms: [["VIEW_INVENTORY", "View spare parts", "See stock levels and parts list"], ["EDIT_INVENTORY", "Edit inventory", "Add, remove, and adjust stock"]] },
                      { label: "Reports", perms: [["VIEW_REPORTS", "View reports", "Access the reports section"], ["VIEW_ANALYTICS", "View analytics", "Access the analytics dashboard"]] },
                      { label: "Administration", perms: [["MANAGE_ENGINEERS", "Manage engineers", "Add and remove engineer accounts"], ["MANAGE_SETTINGS", "Manage settings", "Access shop settings"]] },
                    ].map(group => (
                      <div key={group.label}>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{group.label}</p>
                        <div className="space-y-1">
                          {(group.perms as [string, string, string][]).map(([perm, label, desc]) => {
                            const enabled = engineerPerms[perm] ?? false;
                            return (
                              <div key={perm} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="min-w-0 pr-4">
                                  <p className="text-sm text-slate-900 dark:text-white font-medium">{label}</p>
                                  <p className="text-xs text-slate-400">{desc}</p>
                                </div>
                                <Toggle value={enabled} onChange={v => togglePerm(perm, v)} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4 text-xs text-blue-700 dark:text-blue-300">
                <p className="font-semibold mb-0.5">How permissions work</p>
                <p>Permission changes take effect within 30 seconds across all engineer sessions. Admins always bypass all permission checks and cannot be restricted.</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Upgrade "coming soon" modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Payments Launching Soon</h3>
            <p className="text-slate-500 text-sm mb-2">You&apos;ve selected the <strong className="text-slate-700 dark:text-slate-200">{upgradePlanKey}</strong> plan. We&apos;ve noted your intent and will notify you when billing goes live.</p>
            <p className="text-slate-400 text-xs mb-6">Continue using all features in the meantime.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowUpgradeModal(false)} className={BTN_SECONDARY + " flex-1"}>Close</button>
              <a href={`mailto:hello@fixflow.ma?subject=Interested in ${upgradePlanKey} plan`} className={BTN_PRIMARY + " flex-1"}>Notify Me</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
