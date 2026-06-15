"use client";
import { useEffect, useRef, useState } from "react";
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

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<typeof PAGES>(PAGES);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setSelected(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    const filtered = query
      ? PAGES.filter((p) => p.label.toLowerCase().includes(query.toLowerCase()))
      : PAGES;
    setResults(filtered);
    setSelected(0);
  }, [query]);

  const navigate = (path: string) => {
    router.push(path);
    setOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[selected]) navigate(results[selected].path);
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
            placeholder="Search pages, work orders..."
            className="text-slate-900 dark:text-white placeholder-slate-400"
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 15 }}
          />
          <kbd className="text-slate-500 bg-slate-100 dark:bg-slate-800" style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4 }}>ESC</kbd>
        </div>
        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          {results.map((item, i) => (
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
          {results.length === 0 && (
            <p className="text-slate-400" style={{ padding: "20px 16px", fontSize: 13, margin: 0, textAlign: "center" }}>
              No results for &quot;{query}&quot;
            </p>
          )}
        </div>
        <div
          className="border-t border-slate-200 dark:border-slate-800"
          style={{ padding: "8px 16px", display: "flex", gap: 12 }}
        >
          <span className="text-slate-400" style={{ fontSize: 11 }}>↑↓ navigate</span>
          <span className="text-slate-400" style={{ fontSize: 11 }}>↵ select</span>
          <span className="text-slate-400" style={{ fontSize: 11 }}>ESC close</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
