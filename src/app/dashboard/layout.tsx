"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  workOrder: { id: string; orderNumber: string } | null;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) loadNotifications();
    const interval = setInterval(() => { if (user) loadNotifications(); }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  async function loadNotifications() {
    const res = await fetch("/api/notifications");
    if (res.ok) setNotifications(await res.json());
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    await loadNotifications();
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: id }) });
    await loadNotifications();
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="text-slate-400 text-sm">Loading...</div>
    </div>
  );

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="text-slate-400 text-sm">Loading...</div>
    </div>
  );

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const nav = [
    { href: "/dashboard", label: "Work Orders", icon: "📋" },
    { href: "/dashboard/spareparts", label: "Spare Parts", icon: "🔧" },
    { href: "/dashboard/customers", label: "Customers", icon: "👤" },
    ...(user.role === "ADMIN" ? [
      { href: "/dashboard/analytics", label: "Analytics", icon: "📊" },
      { href: "/dashboard/engineers", label: "Engineers", icon: "👥" },const nav = [
    { href: "/dashboard", label: "Work Orders", icon: "📋" },
    { href: "/dashboard/spareparts", label: "Spare Parts", icon: "🔧" },
    { href: "/dashboard/customers", label: "Customers", icon: "👤" },
    { href: "/dashboard/shifts", label: "Shifts", icon: "🕐" },
    { href: "/dashboard/ratings", label: "Satisfaction", icon: "⭐" },
    { href: "/dashboard/csv", label: "CSV Import", icon: "📂" },
    ...(user.role === "ADMIN" ? [
      { href: "/dashboard/analytics", label: "Analytics", icon: "📊" },
      { href: "/dashboard/engineers", label: "Engineers", icon: "👥" },
      { href: "/dashboard/reports", label: "Reports", icon: "📈" },
      { href: "/dashboard/shops", label: "Shops", icon: "🏪" },
      { href: "/dashboard/warranties", label: "Warranties", icon: "🛡" },
    ] : []),
  ];
      { href: "/dashboard/reports", label: "Reports", icon: "📈" },
    ] : []),
  ];

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-5 border-b border-slate-800">
          <div className="text-lg font-semibold text-white tracking-tight">FixFlow</div>
          <div className="text-xs text-slate-500 mt-0.5">{user.name}</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-800 space-y-1">
          {/* Notification bell */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span>🔔</span>
              Notifications
            </div>
            {unread > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unread}</span>
            )}
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto relative">
        {/* Notification panel */}
        {showNotifications && (
          <div className="absolute top-0 right-0 w-96 h-full bg-slate-900 border-l border-slate-800 z-50 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white">Notifications</h2>
              <div className="flex items-center gap-3">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-blue-400 hover:text-blue-300">Mark all read</button>
                )}
                <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {notifications.length === 0 && (
                <p className="text-sm text-slate-500 text-center mt-8">No notifications</p>
              )}
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-3 rounded-lg text-xs cursor-pointer transition-colors ${
                    n.read ? "bg-slate-800/50 text-slate-400" : "bg-slate-800 text-white border border-slate-700"
                  }`}
                  onClick={() => {
                    markRead(n.id);
                    if (n.workOrder) {
                      setShowNotifications(false);
                      router.push(`/dashboard/workorders/${n.workOrder.id}`);
                    }
                  }}
                >
                  <p className="leading-relaxed">{n.message}</p>
                  <p className="text-slate-600 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
