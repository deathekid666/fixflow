"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import OnboardingWizard from "@/components/OnboardingWizard";
import TrialBanner from "@/components/TrialBanner";

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
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { refresh(); }, []);

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
    if (user) loadNotifications();
    const interval = setInterval(() => { if (user) loadNotifications(); }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  async function loadNotifications() {
    const res = await fetch("/api/notifications", { credentials: "include" });
    if (res.ok) setNotifications(await res.json());
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({}) });
    await loadNotifications();
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ notificationId: id }) });
    await loadNotifications();
  }

  if (loading || !user) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="text-slate-400 text-sm">Loading...</div>
    </div>
  );

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  }

  const nav = [
    { href: "/dashboard", label: "Work Orders", icon: "📋" },
    { href: "/dashboard/spareparts", label: "Spare Parts", icon: "🔧" },
    { href: "/dashboard/customers", label: "Customers", icon: "👤" },
    { href: "/dashboard/warranties", label: "Warranties", icon: "🛡️" },
    { href: "/dashboard/ratings", label: "Satisfaction", icon: "⭐" },
    { href: "/dashboard/csv", label: "CSV Import", icon: "📂" },
    ...(user.role === "ADMIN" ? [
      { href: "/dashboard/analytics", label: "Analytics", icon: "📊" },
      { href: "/dashboard/engineers", label: "Engineers", icon: "👥" },
      { href: "/dashboard/reports", label: "Reports", icon: "📈" },
      { href: "/dashboard/templates", label: "Templates", icon: "🗂️" },
      ...(user.isSuperAdmin ? [
        { href: "/dashboard/shops", label: "Shops", icon: "🏪" },
      ] : []),
      { href: "/dashboard/expenses", label: "Expenses", icon: "💸" },
    ] : []),
    { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
  ];

  const bottomNav = [
    { href: "/dashboard", label: "Orders", icon: "📋" },
    { href: "/dashboard/spareparts", label: "Parts", icon: "🔧" },
    { href: "/dashboard/customers", label: "Customers", icon: "👤" },
    { href: "/dashboard/analytics", label: "Analytics", icon: "📊" },
    { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
  ];

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-56 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-white tracking-tight">FixFlow</div>
            <div className="text-xs text-slate-500 mt-0.5">{user.name}</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white text-xl leading-none">✕</button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}>
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-800 space-y-1">
          <button onClick={() => setShowNotifications(!showNotifications)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-3"><span>🔔</span>Notifications</div>
            {unread > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unread}</span>}
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-white font-semibold text-sm">FixFlow</span>
          <button onClick={() => setShowNotifications(!showNotifications)} className="text-slate-400 hover:text-white relative p-1">
            <span className="text-lg">🔔</span>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{unread}</span>
            )}
          </button>
        </header>

        <TrialBanner />

        <main className="flex-1 overflow-auto relative pb-16 lg:pb-0">
          {showNotifications && (
            <div className="absolute top-0 right-0 w-full sm:w-96 h-full bg-slate-900 border-l border-slate-800 z-50 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <h2 className="text-sm font-semibold text-white">Notifications</h2>
                <div className="flex items-center gap-3">
                  {unread > 0 && <button onClick={markAllRead} className="text-xs text-blue-400 hover:text-blue-300">Mark all read</button>}
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {notifications.length === 0 && <p className="text-sm text-slate-500 text-center mt-8">No notifications</p>}
                {notifications.map(n => (
                  <div key={n.id}
                    className={`p-3 rounded-lg text-xs cursor-pointer transition-colors ${n.read ? "bg-slate-800/50 text-slate-400" : "bg-slate-800 text-white border border-slate-700"}`}
                    onClick={() => { markRead(n.id); if (n.workOrder) { setShowNotifications(false); router.push(`/dashboard/workorders/${n.workOrder.id}`); } }}>
                    <p className="leading-relaxed">{n.message}</p>
                    <p className="text-slate-600 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {user && !user.isSuperAdmin && user.shop && !user.shop.onboardingComplete && (
            <OnboardingWizard shopId={user.shopId ?? ""} shopName={user.shop.name ?? ""} />
          )}
          {children}
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 z-30 flex items-stretch pb-safe">
          {bottomNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors">
                <span className={`flex items-center justify-center w-10 h-7 rounded-xl text-lg transition-all ${active ? "bg-blue-600/20" : ""}`}>
                  {item.icon}
                </span>
                <span className={`text-[10px] font-medium leading-none transition-colors ${active ? "text-blue-400" : "text-slate-500"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}