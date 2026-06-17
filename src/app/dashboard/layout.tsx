"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useState, useCallback } from "react";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import OnboardingWizard from "@/components/OnboardingWizard";
import TrialBanner from "@/components/TrialBanner";
import { CommandPalette } from "@/components/CommandPalette";
import { NotificationBell } from "@/components/NotificationBell";
import CertBadge from "@/components/CertBadge";
import OnboardingTour from "@/components/OnboardingTour";
import DashboardPWA from "@/components/DashboardPWA";

type Notification = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  workOrder: { id: string; orderNumber: string } | null;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, refresh } = useAuth();
  const { lang, t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingApptCount, setPendingApptCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [globalScanActive, setGlobalScanActive] = useState(false);
  const [scanToast, setScanToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { refresh(); }, []);
  useEffect(() => { setGlobalScanActive(localStorage.getItem("fixflow-global-scan") === "1"); }, []);

  const handleGlobalScan = useCallback(async (code: string) => {
    setScanToast({ msg: `Searching "${code}"…`, ok: true });
    try {
      const res = await fetch(`/api/workorders?search=${encodeURIComponent(code)}&limit=3`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const orders = await res.json();
      if (orders.length === 0) {
        setScanToast({ msg: `No work order found for: ${code}`, ok: false });
        setTimeout(() => setScanToast(null), 4000);
        return;
      }
      const exact = orders.find((o: { orderNumber: string }) =>
        o.orderNumber === code || o.orderNumber.endsWith(code)
      ) ?? orders[0];
      setScanToast({ msg: `Opening ${exact.customerName}'s order…`, ok: true });
      setTimeout(() => setScanToast(null), 2000);
      router.push(`/dashboard/workorders/${exact.id}`);
    } catch {
      setScanToast({ msg: "Scan failed — check connection", ok: false });
      setTimeout(() => setScanToast(null), 3000);
    }
  }, [router]);

  useBarcodeScanner({ onScan: handleGlobalScan, enabled: !!(globalScanActive && user && !user.isSuperAdmin) });

  function toggleGlobalScan() {
    const next = !globalScanActive;
    setGlobalScanActive(next);
    localStorage.setItem("fixflow-global-scan", next ? "1" : "0");
  }

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user && !user.isSuperAdmin) {
      fetch("/api/me/shop-status", { credentials: "include" })
        .then(r => r.json())
        .then(data => {
          if (data.suspended) window.location.href = "/suspended?reason=suspended";
          if (data.trialExpired) window.location.href = "/suspended?reason=trial";
        }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (user) loadNotificationsForPanel();
    const interval = setInterval(() => { if (user) loadNotificationsForPanel(); }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (user && !user.isSuperAdmin) loadUnreadCounts();
    const interval = setInterval(() => { if (user && !user.isSuperAdmin) loadUnreadCounts(); }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  async function loadUnreadCounts() {
    try {
      const res = await fetch("/api/notifications/unread", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count ?? 0);
        setUnreadMessages(data.unreadMessages ?? 0);
        setPendingApptCount(data.pendingAppts ?? 0);
        setLowStockCount(data.lowStockCount ?? 0);
      }
    } catch { /* ignore */ }
  }

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  async function loadNotificationsForPanel() {
    const res = await fetch("/api/notifications", { credentials: "include" });
    if (res.ok) setNotifications(await res.json());
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({}) });
    await loadNotificationsForPanel();
    setUnreadCount(0);
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ notificationId: id }) });
    await loadNotificationsForPanel();
  }

  if (loading || !user) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <svg className="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-xs text-slate-400">Loading FixFlow…</span>
      </div>
    </div>
  );

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  }

  const TOUR_IDS: Record<string, string> = {
    "/dashboard": "tour-step-workorders",
    "/dashboard/spareparts": "tour-step-spareparts",
    "/dashboard/analytics": "tour-step-analytics",
    "/dashboard/engineers": "tour-step-engineers",
    "/dashboard/settings": "tour-step-settings",
  };

  const nav = [
    { href: "/dashboard", label: t("workOrders"), icon: "📋" },
    { href: "/dashboard/appointments", label: "Appointments", icon: "📅" },
    { href: "/dashboard/spareparts", label: t("spareParts"), icon: "🔧" },
    { href: "/dashboard/suppliers", label: "Suppliers", icon: "🏭" },
    { href: "/dashboard/customers", label: t("customers"), icon: "👤" },
    { href: "/dashboard/warranties", label: t("warranties"), icon: "🛡️" },
    { href: "/dashboard/ratings", label: t("satisfaction"), icon: "⭐" },
    { href: "/dashboard/certification", label: "Certification", icon: "🏆" },
    { href: "/dashboard/messages", label: "Messages", icon: "💬" },
    { href: "/dashboard/csv", label: t("csvImport"), icon: "📂" },
    ...(user.role === "ADMIN" ? [
      { href: "/dashboard/analytics", label: t("analytics"), icon: "📊" },
      { href: "/dashboard/engineers", label: t("engineers"), icon: "👥" },
      { href: "/dashboard/reports", label: t("reports"), icon: "📈" },
      { href: "/dashboard/templates", label: t("templates"), icon: "🗂️" },
      ...(user.isSuperAdmin ? [
        { href: "/dashboard/shops", label: t("shops"), icon: "🏪" },
      ] : []),
      { href: "/dashboard/expenses", label: t("expenses"), icon: "💸" },
    ] : []),
    { href: "/dashboard/contracts", label: "Contracts", icon: "📄" },
    { href: "/dashboard/pos", label: "Point of Sale", icon: "🏧" },
    { href: "/dashboard/shifts", label: "Shifts", icon: "🕐" },
    { href: "/dashboard/academy", label: "Academy", icon: "🎓" },
    { href: "/dashboard/settings", label: t("settings"), icon: "⚙️" },
  ];

  const bottomNav = [
    { href: "/dashboard", label: t("orders"), icon: "📋" },
    { href: "/dashboard/spareparts", label: t("parts"), icon: "🔧" },
    { href: "/dashboard/customers", label: t("customers"), icon: "👤" },
    { href: "/dashboard/analytics", label: t("analytics"), icon: "📊" },
    { href: "/dashboard/settings", label: t("settings"), icon: "⚙️" },
  ];

  const panelUnread = notifications.filter(n => !n.read).length;

  const slideClass = sidebarOpen
    ? "translate-x-0"
    : lang === "ar"
      ? "translate-x-full lg:translate-x-0"
      : "-translate-x-full lg:translate-x-0";

  const fontFamily = lang === "ar"
    ? "'Tajawal', 'DM Sans', sans-serif"
    : "'DM Sans', sans-serif";

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100" style={{ fontFamily }}>
      {/* PWA: manifest, SW, install prompt, pull-to-refresh, push */}
      <link rel="manifest" href="/manifest-dashboard.json" />
      <meta name="theme-color" content="#0f172a" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="FixFlow" />
      <link rel="apple-touch-icon" href="/icons/pwa-icon.svg" />
      <DashboardPWA userId={user.id} />
      <CommandPalette />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 rtl:left-auto rtl:right-0 z-50
        flex-shrink-0 bg-white dark:bg-slate-900
        border-r border-slate-200 dark:border-slate-800 rtl:border-r-0 rtl:border-l
        flex flex-col transform transition-all duration-200 ease-in-out
        ${slideClass}
      `}
        style={{ width: collapsed ? 56 : 224 }}
      >
        <div id="tour-step-dashboard" className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between overflow-hidden">
          <button onClick={() => window.location.reload()} className="text-left hover:opacity-70 transition-opacity min-w-0">
            <div className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">{collapsed ? "F" : "FixFlow"}</div>
            {!collapsed && <div className="text-xs text-slate-500 mt-0.5 truncate">{user.name}</div>}
            {!collapsed && user.shop?.certification && (
              <div className="mt-1.5">
                <CertBadge level={user.shop.certification} size="xs" />
              </div>
            )}
          </button>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xl leading-none">✕</button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                id={TOUR_IDS[item.href]}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${collapsed ? "justify-center" : ""} ${
                  active
                    ? "text-blue-600 dark:text-blue-400 font-medium"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                style={active ? { background: "rgba(37,99,235,0.15)", borderLeft: "3px solid #2563eb", paddingLeft: collapsed ? 9 : 9 } : undefined}>
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!collapsed && item.href === "/dashboard/appointments" && pendingApptCount > 0 && (
                  <span className="text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold leading-none flex-shrink-0 bg-yellow-500 text-white">
                    {pendingApptCount > 9 ? "9+" : pendingApptCount}
                  </span>
                )}
                {!collapsed && item.href === "/dashboard/messages" && unreadMessages > 0 && (
                  <span className="text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold leading-none flex-shrink-0 bg-blue-500 text-white">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
                {!collapsed && item.href === "/dashboard/spareparts" && lowStockCount > 0 && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0 bg-orange-500" title={`${lowStockCount} low stock`} />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1 overflow-hidden">
          <button onClick={() => setShowNotifications(!showNotifications)}
            title={collapsed ? t("notifications") : undefined}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${collapsed ? "justify-center" : ""}`}>
            <div className="flex items-center gap-3"><span>🔔</span>{!collapsed && t("notifications")}</div>
            {!collapsed && unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </button>
          <button onClick={handleLogout}
            title={collapsed ? t("logout") : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${collapsed ? "justify-center" : ""}`}>
            <span>🚪</span>{!collapsed && t("logout")}
          </button>
          <button onClick={() => setCollapsed(c => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${collapsed ? "justify-center" : ""}`}>
            <span>{collapsed ? "→" : "←"}</span>{!collapsed && <span className="flex-1 text-left">Collapse</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop header */}
        <header className="hidden lg:flex items-center justify-end gap-2 px-6 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
          <button
            onClick={() => { const e = new KeyboardEvent("keydown", { key: "k", ctrlKey: true }); window.dispatchEvent(e); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Command palette">
            🔍 Search
            <kbd className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">Ctrl K</kbd>
          </button>
          {!user?.isSuperAdmin && (
            <button
              onClick={toggleGlobalScan}
              title={globalScanActive ? "Global scan ON — scan any barcode to open its work order" : "Enable global barcode scan mode"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                globalScanActive
                  ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
                  : "text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span className="font-mono tracking-tighter text-[11px] leading-none">▌▌▌</span>
              {globalScanActive ? "Scan ON" : "Scan"}
            </button>
          )}
          <NotificationBell unreadCount={unreadCount} />
        </header>

        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 -ml-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-slate-900 dark:text-white font-semibold text-sm">FixFlow</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowNotifications(!showNotifications)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white relative p-2 -mr-2">
              <span className="text-lg">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 rtl:right-auto rtl:-left-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </button>
          </div>
        </header>

        <TrialBanner />

        <main id="dashboard-main" key={pathname} className="page-enter flex-1 overflow-auto relative pb-16 lg:pb-0">
          {showNotifications && (
            <div className="absolute top-0 right-0 rtl:right-auto rtl:left-0 w-full sm:w-96 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 rtl:border-l-0 rtl:border-r z-50 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t("notifications")}</h2>
                <div className="flex items-center gap-3">
                  {panelUnread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                      {t("markAllRead")}
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {notifications.length === 0 && (
                  <p className="text-sm text-slate-500 text-center mt-8">{t("noNotifications")}</p>
                )}
                {notifications.map(n => (
                  <div key={n.id}
                    className={`p-3 rounded-lg text-xs cursor-pointer transition-colors ${
                      n.read
                        ? "bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                    }`}
                    onClick={() => { markRead(n.id); if (n.workOrder) { setShowNotifications(false); router.push(`/dashboard/workorders/${n.workOrder.id}`); } }}>
                    <p className="leading-relaxed">{n.message}</p>
                    <p className="text-slate-400 dark:text-slate-600 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {user && !user.isSuperAdmin && user.shop && !user.shop.onboardingComplete && (
            <OnboardingWizard shopId={user.shopId ?? ""} shopName={user.shop.name ?? ""} />
          )}
          {user && !user.isSuperAdmin && user.shop?.onboardingComplete && (
            <OnboardingTour userId={user.id} userRole={user.role} />
          )}
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 z-30 flex items-stretch pb-safe">
          {bottomNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors">
                <span className={`flex items-center justify-center w-10 h-7 rounded-xl text-lg transition-all ${active ? "bg-blue-600/20" : ""}`}>
                  {item.icon}
                </span>
                <span className={`text-[10px] font-medium leading-none transition-colors ${active ? "text-blue-600 dark:text-blue-400" : "text-slate-500"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Global scan toast */}
      {scanToast && (
        <div className={`fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-xl text-sm font-medium shadow-xl z-[9999] whitespace-nowrap pointer-events-none ${
          scanToast.ok ? "bg-green-600 text-white" : "bg-slate-800 dark:bg-slate-700 text-white"
        }`}>
          {scanToast.msg}
        </div>
      )}
    </div>
  );
}
