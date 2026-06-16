"use client";
import { useEffect, useState, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Photo = { id: string; path: string; tag: string };

type Order = {
  id: string;
  orderNumber: string;
  deviceBrand: string;
  deviceModel: string;
  status: string;
  repairType: string | null;
  faultDescription: string;
  receivedAt: string;
  doneAt: string | null;
  deliveredAt: string | null;
  warrantyStart: string | null;
  warrantyEnd: string | null;
  isUnderWarranty: boolean;
  customerName: string;
  total: number;
  shop: { name: string; logoUrl: string | null; phone: string | null; address: string | null };
  photos: Photo[];
};

type Tab = "repairs" | "timeline" | "more";
type Screen = "phone" | "app";

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
  RECEIVED:   { label: "Received",          icon: "📥", color: "#3b82f6", bg: "#eff6ff",  border: "#bfdbfe" },
  DIAGNOSING: { label: "Diagnosing",        icon: "🔍", color: "#d97706", bg: "#fffbeb",  border: "#fde68a" },
  REPAIRING:  { label: "In Repair",         icon: "🔧", color: "#ea580c", bg: "#fff7ed",  border: "#fed7aa" },
  DONE:       { label: "Ready for Pickup",  icon: "✅", color: "#16a34a", bg: "#f0fdf4",  border: "#bbf7d0" },
  DELIVERED:  { label: "Delivered",         icon: "🎉", color: "#475569", bg: "#f8fafc",  border: "#e2e8f0" },
  CANCELLED:  { label: "Cancelled",         icon: "❌", color: "#dc2626", bg: "#fef2f2",  border: "#fecaca" },
  BOUNCED:    { label: "Returned",          icon: "↩️", color: "#9333ea", bg: "#faf5ff",  border: "#e9d5ff" },
};

const STATUS_STEPS = ["RECEIVED", "DIAGNOSING", "REPAIRING", "DONE", "DELIVERED"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(d: string | null): string {
  if (!d) return "–";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

function fmtMonth(d: string): string {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(d));
}

function warrantyStatus(order: Order): { label: string; color: string; bg: string } {
  const now = new Date();
  if (order.warrantyEnd) {
    const end = new Date(order.warrantyEnd);
    if (end > now) {
      const days = Math.ceil((end.getTime() - now.getTime()) / 86400000);
      return {
        label: days > 30 ? `Warranty · expires ${fmtDate(order.warrantyEnd)}` : `Warranty · ${days}d left`,
        color: "#16a34a",
        bg: "#f0fdf4",
      };
    }
    return { label: `Expired · ${fmtDate(order.warrantyEnd)}`, color: "#64748b", bg: "#f8fafc" };
  }
  if (order.isUnderWarranty) return { label: "Under Warranty", color: "#16a34a", bg: "#f0fdf4" };
  return { label: "No Warranty", color: "#94a3b8", bg: "#f8fafc" };
}

const PHONE_KEY = "fixflow_customer_phone";

// ─── Component ───────────────────────────────────────────────────────────────
export default function MyRepairsPage() {
  const [screen, setScreen] = useState<Screen>("phone");
  const [phone, setPhone] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);
  const [tab, setTab] = useState<Tab>("repairs");
  const [selected, setSelected] = useState<Order | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [installed, setInstalled] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Service worker + install prompt
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
      navigator.serviceWorker.addEventListener("message", (e) => {
        if (e.data?.type === "ONLINE") setOffline(false);
      });
    }
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => { setInstalled(true); setInstallPrompt(null); });
    window.addEventListener("offline", () => setOffline(true));
    window.addEventListener("online", () => setOffline(false));
    setOffline(!navigator.onLine);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Restore saved phone
  useEffect(() => {
    const saved = localStorage.getItem(PHONE_KEY);
    if (saved) {
      setPhone(saved);
      setPhoneInput(saved);
      setScreen("app");
    }
  }, []);

  const fetchRepairs = useCallback(async (ph: string) => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/customer/repairs?phone=${encodeURIComponent(ph)}`);
      const data = await r.json();
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setError(data.error ?? "Something went wrong");
      }
    } catch {
      setError("Could not load repairs. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (screen === "app" && phone) fetchRepairs(phone);
  }, [screen, phone, fetchRepairs]);

  function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = phoneInput.trim();
    if (trimmed.replace(/\D/g, "").length < 6) return;
    localStorage.setItem(PHONE_KEY, trimmed);
    setPhone(trimmed);
    setScreen("app");
  }

  function changePhone() {
    localStorage.removeItem(PHONE_KEY);
    setPhone("");
    setPhoneInput("");
    setOrders([]);
    setScreen("phone");
  }

  async function handleInstall() {
    if (!installPrompt) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (installPrompt as any).prompt?.();
    if (result?.outcome === "accepted") { setInstalled(true); setInstallPrompt(null); }
  }

  // ── Phone Entry Screen ───────────────────────────────────────────────────
  if (screen === "phone") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <div className="text-5xl mb-4">🔧</div>
            <h1 className="text-2xl font-bold text-white">Track Your Repairs</h1>
            <p className="text-slate-400 mt-2 text-sm">Enter the phone number you used at the repair shop</p>
          </div>

          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Your Phone Number</label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+212 6XX XXX XXX"
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-1.5">We never store your number anywhere — it stays on your device.</p>
            </div>
            <button
              type="submit"
              disabled={phoneInput.replace(/\D/g, "").length < 6}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              View My Repairs →
            </button>
          </form>

          {installPrompt && !installed && (
            <button
              onClick={handleInstall}
              className="w-full py-3 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>📲</span> Add to Home Screen
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── App Shell ────────────────────────────────────────────────────────────
  const activeOrders = orders.filter((o) => !["DELIVERED", "CANCELLED", "BOUNCED"].includes(o.status));
  const doneOrders = orders.filter((o) => ["DELIVERED", "CANCELLED", "BOUNCED"].includes(o.status));

  // Group for timeline
  const byMonth: Record<string, Order[]> = {};
  [...orders].sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
    .forEach((o) => {
      const key = fmtMonth(o.receivedAt);
      if (!byMonth[key]) byMonth[key] = [];
      byMonth[key].push(o);
    });

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden select-none">
      {/* Offline banner */}
      {offline && (
        <div className="bg-amber-500 text-white text-xs font-medium text-center py-2 z-50">
          You&apos;re offline — showing cached repairs
        </div>
      )}

      {/* Content area */}
      <main className="flex-1 overflow-y-auto pb-20">
        {/* ── Repairs Tab ──────────────────────────────────────────────── */}
        {tab === "repairs" && (
          <div>
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-bold text-slate-900">My Repairs</h1>
                  <p className="text-xs text-slate-500">{phone}</p>
                </div>
                <button
                  onClick={() => fetchRepairs(phone)}
                  disabled={loading}
                  className="text-xs text-blue-600 font-medium py-1.5 px-3 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  {loading ? "…" : "↻ Refresh"}
                </button>
              </div>
            </div>

            {loading && orders.length === 0 ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 animate-pulse space-y-2 border border-slate-100">
                    <div className="flex gap-3">
                      <div className="w-3 h-16 bg-slate-200 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                        <div className="h-3 bg-slate-200 rounded w-1/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-6 text-center space-y-3">
                <div className="text-4xl">⚠️</div>
                <p className="text-slate-600">{error}</p>
                <button onClick={() => fetchRepairs(phone)} className="text-sm text-blue-600 font-medium">Try again</button>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="text-5xl">🔍</div>
                <p className="text-slate-700 font-medium">No repairs found</p>
                <p className="text-sm text-slate-500">No work orders found for <strong>{phone}</strong>.<br />Make sure you used this number at the shop.</p>
                <button onClick={changePhone} className="text-sm text-blue-600 font-medium">Try a different number</button>
              </div>
            ) : (
              <div className="p-4 space-y-5">
                {/* Active */}
                {activeOrders.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
                      Active ({activeOrders.length})
                    </div>
                    <div className="space-y-3">
                      {activeOrders.map((o) => <RepairCard key={o.id} order={o} onTap={() => setSelected(o)} />)}
                    </div>
                  </div>
                )}
                {/* Past */}
                {doneOrders.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
                      History ({doneOrders.length})
                    </div>
                    <div className="space-y-3">
                      {doneOrders.map((o) => <RepairCard key={o.id} order={o} onTap={() => setSelected(o)} />)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Timeline Tab ─────────────────────────────────────────────── */}
        {tab === "timeline" && (
          <div>
            <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
              <h1 className="text-lg font-bold text-slate-900">Repair History</h1>
              <p className="text-xs text-slate-500">{orders.length} repairs total</p>
            </div>
            {orders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No repair history yet.</div>
            ) : (
              <div className="p-4 space-y-6">
                {Object.entries(byMonth).map(([month, monthOrders]) => (
                  <div key={month}>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{month}</div>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
                      <div className="space-y-4">
                        {monthOrders.map((o) => {
                          const cfg = STATUS_CFG[o.status] ?? STATUS_CFG.RECEIVED;
                          return (
                            <button
                              key={o.id}
                              onClick={() => setSelected(o)}
                              className="w-full pl-10 pr-2 text-left"
                            >
                              <div className="absolute left-2.5 mt-3 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                                style={{ backgroundColor: cfg.color }} />
                              <div className="bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="font-medium text-slate-900 text-sm">{o.deviceBrand} {o.deviceModel}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">{o.shop.name} · {fmtDate(o.receivedAt)}</div>
                                  </div>
                                  <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
                                    style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                                    {cfg.icon} {cfg.label}
                                  </span>
                                </div>
                                {o.repairType && <div className="text-xs text-slate-500 mt-1">{o.repairType}</div>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── More Tab ─────────────────────────────────────────────────── */}
        {tab === "more" && (
          <div>
            <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
              <h1 className="text-lg font-bold text-slate-900">Settings</h1>
            </div>
            <div className="p-4 space-y-4">
              {/* Account */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Your Phone</div>
                </div>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">{phone}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{orders.length} repairs found</div>
                  </div>
                  <button
                    onClick={changePhone}
                    className="text-sm text-blue-600 font-medium py-1.5 px-3 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Install */}
              {!installed && installPrompt && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <div className="font-medium text-blue-900 mb-1">📲 Add to Home Screen</div>
                  <p className="text-sm text-blue-700 mb-3">Install the app for faster access and offline viewing.</p>
                  <button
                    onClick={handleInstall}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors"
                  >
                    Install App
                  </button>
                </div>
              )}
              {installed && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <div className="font-medium text-emerald-900">App installed!</div>
                    <div className="text-sm text-emerald-700">Open from your home screen anytime.</div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Summary</div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xl font-bold text-slate-900">{orders.length}</div>
                    <div className="text-xs text-slate-500">Total</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-emerald-600">{activeOrders.length}</div>
                    <div className="text-xs text-slate-500">Active</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-slate-500">{doneOrders.length}</div>
                    <div className="text-xs text-slate-500">Completed</div>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-slate-400 pt-2">
                <a href="/customer-app" className="hover:text-slate-600 transition-colors">FixFlow Customer App</a>
                <span className="mx-2">·</span>
                <a href="/" className="hover:text-slate-600 transition-colors">For Shops</a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 pb-safe z-20">
        <div className="flex">
          {([
            { id: "repairs" as Tab, icon: "🔧", label: "Repairs", badge: activeOrders.length },
            { id: "timeline" as Tab, icon: "📅", label: "History", badge: 0 },
            { id: "more" as Tab, icon: "⚙️", label: "More", badge: 0 },
          ] as const).map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 relative transition-colors ${tab === item.id ? "text-blue-600" : "text-slate-400"}`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.badge > 0 && (
                <span className="absolute top-2 right-[calc(50%-14px)] w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Repair Detail Bottom Sheet */}
      {selected && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          <div
            ref={sheetRef}
            className="relative bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto z-50"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            {/* Sheet header */}
            <div className="px-5 pt-2 pb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selected.deviceBrand} {selected.deviceModel}</h2>
                <p className="text-sm text-slate-500">{selected.shop.name} · #{selected.orderNumber.slice(-8).toUpperCase()}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none mt-0.5">✕</button>
            </div>

            {/* Status banner */}
            {(() => {
              const cfg = STATUS_CFG[selected.status] ?? STATUS_CFG.RECEIVED;
              return (
                <div className="mx-5 mb-5 rounded-2xl p-4" style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{cfg.icon}</span>
                    <div>
                      <div className="font-semibold" style={{ color: cfg.color }}>{cfg.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {selected.status === "DONE" ? "Your device is ready for pickup!" :
                         selected.status === "DELIVERED" ? `Delivered on ${fmtDate(selected.deliveredAt)}` :
                         selected.status === "CANCELLED" ? "This repair was cancelled" :
                         "We'll notify you when the status changes"}
                      </div>
                    </div>
                  </div>

                  {/* Progress steps */}
                  {["RECEIVED", "DIAGNOSING", "REPAIRING", "DONE", "DELIVERED"].includes(selected.status) && (
                    <div className="mt-4 flex items-center gap-0">
                      {STATUS_STEPS.map((s, i) => {
                        const idx = STATUS_STEPS.indexOf(selected.status);
                        const done = i <= idx;
                        return (
                          <div key={s} className="flex items-center flex-1 last:flex-none">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${done ? "text-white" : "bg-slate-200 text-slate-400"}`}
                              style={done ? { backgroundColor: cfg.color } : {}}>
                              {done ? "✓" : i + 1}
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`flex-1 h-0.5 ${i < idx ? "" : "bg-slate-200"}`}
                                style={i < idx ? { backgroundColor: cfg.color } : {}} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="px-5 space-y-5 pb-6">
              {/* Repair details */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Repair Details</div>
                {[
                  { label: "Fault", value: selected.faultDescription },
                  { label: "Type", value: selected.repairType ?? "–" },
                  { label: "Received", value: fmtDate(selected.receivedAt) },
                  { label: "Completed", value: fmtDate(selected.doneAt) },
                  { label: "Delivered", value: fmtDate(selected.deliveredAt) },
                  { label: "Shop", value: selected.shop.name },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="text-slate-900 font-medium text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>

              {/* Warranty */}
              {(() => {
                const w = warrantyStatus(selected);
                return (
                  <div className="rounded-2xl border p-4 flex items-center gap-3"
                    style={{ backgroundColor: w.bg, borderColor: w.color + "40" }}>
                    <span className="text-2xl">{w.label.startsWith("No") ? "🔓" : w.label.startsWith("Expired") ? "🔒" : "🛡️"}</span>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: w.color }}>{w.label}</div>
                    </div>
                  </div>
                );
              })()}

              {/* Photos */}
              {selected.photos.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Photos</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(() => {
                      const intake = selected.photos.filter(p => p.tag === "intake");
                      const completion = selected.photos.filter(p => p.tag === "completion");
                      const groups = [
                        { label: "Before", photos: intake },
                        { label: "After", photos: completion },
                      ].filter(g => g.photos.length > 0);
                      return groups.map(group => (
                        <div key={group.label} className="space-y-1.5">
                          <div className="text-xs text-slate-500 text-center">{group.label}</div>
                          <button
                            onClick={() => setLightbox(group.photos[0].path)}
                            className="w-full aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200"
                          >
                            <img src={group.photos[0].path} alt={group.label} className="w-full h-full object-cover" />
                          </button>
                          {group.photos.length > 1 && (
                            <div className="grid grid-cols-3 gap-1">
                              {group.photos.slice(1, 4).map(p => (
                                <button key={p.id} onClick={() => setLightbox(p.path)}
                                  className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                                  <img src={p.path} alt="" className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3 pt-1">
                <a
                  href={`/track/${selected.orderNumber}`}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl text-sm transition-colors"
                >
                  💬 Full Tracking Page & Chat
                </a>
                {selected.shop.phone && (
                  <a
                    href={`tel:${selected.shop.phone}`}
                    className="flex items-center justify-center gap-2 w-full py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-2xl text-sm transition-colors"
                  >
                    📞 Call {selected.shop.name}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white text-3xl z-10">✕</button>
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain p-4" />
        </div>
      )}
    </div>
  );
}

// ─── Repair Card ─────────────────────────────────────────────────────────────
function RepairCard({ order, onTap }: { order: Order; onTap: () => void }) {
  const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.RECEIVED;
  const w = warrantyStatus(order);
  const hasPhotos = order.photos.length > 0;

  return (
    <button
      onClick={onTap}
      className="w-full text-left bg-white rounded-2xl border border-slate-200 hover:border-slate-300 active:scale-[0.99] transition-all overflow-hidden shadow-sm"
    >
      <div className="flex">
        {/* Status bar */}
        <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: cfg.color }} />

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900">{order.deviceBrand} {order.deviceModel}</div>
              <div className="text-sm text-slate-500 mt-0.5">{order.shop.name}</div>
              {order.repairType && (
                <div className="text-xs text-slate-400 mt-0.5">{order.repairType}</div>
              )}
            </div>
            <div className="flex-shrink-0 text-right space-y-1.5">
              <div className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
                style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                {cfg.icon} {cfg.label}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>{fmtDate(order.receivedAt)}</span>
              {hasPhotos && <span>📸 {order.photos.length}</span>}
            </div>
            <div className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: w.color }}>
              {w.label.split(" ·")[0]}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
