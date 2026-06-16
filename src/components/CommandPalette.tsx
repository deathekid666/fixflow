"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const PAGES = [
  { label: "Work Orders", path: "/dashboard", icon: "📋" },
  { label: "New Work Order", path: "/dashboard/workorders/new", icon: "➕" },
  { label: "Customers", path: "/dashboard/customers", icon: "👥" },
  { label: "Spare Parts", path: "/dashboard/spareparts", icon: "🔧" },
  { label: "Suppliers", path: "/dashboard/suppliers", icon: "🏭" },
  { label: "Appointments", path: "/dashboard/appointments", icon: "📅" },
  { label: "Analytics", path: "/dashboard/analytics", icon: "📊" },
  { label: "Engineers", path: "/dashboard/engineers", icon: "👷" },
  { label: "Messages", path: "/dashboard/messages", icon: "💬" },
  { label: "Settings", path: "/dashboard/settings", icon: "⚙️" },
];

type WorkOrderResult = {
  id: string;
  orderNumber: string;
  customerName: string;
  deviceBrand: string;
  deviceModel: string;
  status: string;
};

type Item =
  | { kind: "page"; label: string; path: string; icon: string }
  | { kind: "order"; order: WorkOrderResult };

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  DIAGNOSING: "#8b5cf6",
  REPAIRING: "#3b82f6",
  DONE: "#10b981",
  DELIVERED: "#6b7280",
  CANCELLED: "#ef4444",
  BOUNCED: "#f97316",
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pageResults, setPageResults] = useState<typeof PAGES>(PAGES);
  const [orderResults, setOrderResults] = useState<WorkOrderResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setSelected(0);
        setOrderResults([]);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const searchOrders = useCallback(async (q: string) => {
    if (q.length < 2) { setOrderResults([]); setSearching(false); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/workorders?search=${encodeURIComponent(q)}&limit=5`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setOrderResults(Array.isArray(data.orders) ? data.orders : Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
    setSearching(false);
  }, []);

  useEffect(() => {
    const filtered = query
      ? PAGES.filter((p) => p.label.toLowerCase().includes(query.toLowerCase()))
      : PAGES;
    setPageResults(filtered);
    setSelected(0);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchOrders(query), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchOrders]);

  const items: Item[] = [
    ...pageResults.map((p) => ({ kind: "page" as const, ...p })),
    ...orderResults.map((o) => ({ kind: "order" as const, order: o })),
  ];

  const navigate = (path: string) => {
    router.push(path);
    setOpen(false);
    setQuery("");
    setOrderResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, items.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && items[selected]) {
      const item = items[selected];
      navigate(item.kind === "page" ? item.path : `/dashboard/workorders/${item.order.id}`);
    }
  };

  if (!open) return null;

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "15vh",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
        style={{
          borderRadius: 16,
          width: "100%", maxWidth: 520,
          boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}
      >
        <div
          className="border-b border-slate-200 dark:border-slate-800"
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}
        >
          <span style={{ fontSize: 16, opacity: 0.5 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, work orders, customers..."
            className="text-slate-900 dark:text-white placeholder-slate-400"
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 15 }}
          />
          {searching && <span style={{ fontSize: 11, color: "#94a3b8" }}>searching…</span>}
          <kbd className="text-slate-500 bg-slate-100 dark:bg-slate-800" style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4 }}>ESC</kbd>
        </div>

        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {/* Page results */}
          {pageResults.length > 0 && (
            <>
              {orderResults.length > 0 && (
                <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", padding: "8px 16px 4px" }}>
                  Pages
                </p>
              )}
              {pageResults.map((item, i) => (
                <div
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  onMouseEnter={() => setSelected(i)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 16px", cursor: "pointer",
                    background: i === selected ? "rgba(37,99,235,0.12)" : "transparent",
                    borderLeft: i === selected ? "2px solid #2563eb" : "2px solid transparent",
                    transition: "background 0.1s",
                  }}
                >
                  <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{item.icon}</span>
                  <span
                    className={i === selected ? "" : "text-slate-700 dark:text-slate-300"}
                    style={{ fontSize: 14, color: i === selected ? "#2563eb" : undefined }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </>
          )}

          {/* Work order results */}
          {orderResults.length > 0 && (
            <>
              <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", padding: "8px 16px 4px" }}>
                Work Orders
              </p>
              {orderResults.map((order, i) => {
                const globalIdx = pageResults.length + i;
                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/dashboard/workorders/${order.id}`)}
                    onMouseEnter={() => setSelected(globalIdx)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 16px", cursor: "pointer",
                      background: globalIdx === selected ? "rgba(37,99,235,0.12)" : "transparent",
                      borderLeft: globalIdx === selected ? "2px solid #2563eb" : "2px solid transparent",
                      transition: "background 0.1s",
                    }}
                  >
                    <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>📋</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          className={globalIdx === selected ? "" : "text-slate-700 dark:text-slate-300"}
                          style={{ fontSize: 14, fontWeight: 500, color: globalIdx === selected ? "#2563eb" : undefined }}
                        >
                          {order.customerName}
                        </span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{order.orderNumber}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>
                        {order.deviceBrand} {order.deviceModel}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
                      background: `${STATUS_COLORS[order.status] ?? "#94a3b8"}22`,
                      color: STATUS_COLORS[order.status] ?? "#94a3b8",
                      textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>
                      {order.status}
                    </span>
                  </div>
                );
              })}
            </>
          )}

          {items.length === 0 && !searching && (
            <p className="text-slate-400" style={{ padding: "20px 16px", fontSize: 13, margin: 0, textAlign: "center" }}>
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
        </div>

        <div
          className="border-t border-slate-200 dark:border-slate-800"
          style={{ padding: "8px 16px", display: "flex", gap: 12 }}
        >
          <span className="text-slate-400" style={{ fontSize: 11 }}>↑↓ navigate</span>
          <span className="text-slate-400" style={{ fontSize: 11 }}>↵ open</span>
          <span className="text-slate-400" style={{ fontSize: 11 }}>ESC close</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
