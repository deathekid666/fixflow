"use client";
import { useEffect, useState } from "react";

type NotifItem = { id: string; text: string; time: string };

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications/unread", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        setUnread(data.count ?? 0);
        setItems(data.items ?? []);
      } catch { /* ignore */ }
    }
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: 8 }}
        aria-label="Notifications"
      >
        <span style={{ fontSize: 20 }}>🔔</span>
        {unread > 0 && (
          <span
            style={{
              position: "absolute", top: 4, right: 4, minWidth: 16, height: 16, padding: "0 3px",
              background: "#ef4444", borderRadius: 99, fontSize: 10,
              color: "white", display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700,
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            style={{
              position: "absolute", top: "100%", right: 0, zIndex: 50,
              borderRadius: 12, width: 300, boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
          >
            <div className="border-b border-slate-200 dark:border-slate-800" style={{ padding: "12px 16px" }}>
              <p className="text-slate-900 dark:text-white" style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Notifications</p>
            </div>
            {items.length === 0 ? (
              <p className="text-slate-400" style={{ padding: "20px 16px", fontSize: 13, margin: 0, textAlign: "center" }}>
                No new notifications
              </p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="border-b border-slate-100 dark:border-slate-800" style={{ padding: "10px 16px" }}>
                  <p className="text-slate-700 dark:text-slate-300" style={{ margin: 0, fontSize: 13 }}>{item.text}</p>
                  <p className="text-slate-400" style={{ margin: "2px 0 0", fontSize: 11 }}>{item.time}</p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
