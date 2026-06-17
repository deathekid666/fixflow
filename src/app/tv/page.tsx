"use client";
import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "react-qr-code";

// ─── Types ───────────────────────────────────────────────────────────────────

type ActiveOrder = {
  id: string; orderNumber: string; status: string;
  customerName: string; deviceBrand: string; deviceModel: string;
  createdAt: string; slaDeadline: string | null; faultLevel: string;
  assignedTo: string | null;
};

type ReadyOrder = {
  id: string; orderNumber: string;
  customerName: string; deviceBrand: string; deviceModel: string;
  updatedAt: string;
};

type Appointment = {
  id: string; customerName: string; deviceBrand: string; deviceModel: string;
  scheduledAt: string; status: string; faultDescription: string;
};

type EngineerLoad = { name: string; count: number; orders: string[] };
type LowStock = { id: string; name: string; partNumber: string | null; stock: number };
type ActivityLog = {
  id: string; action: string; description: string | null; createdAt: string;
  workOrder: { orderNumber: string; customerName: string };
};

type TvData = {
  shop: { id: string; name: string; logoUrl: string | null };
  activeOrders: ActiveOrder[];
  readyOrders: ReadyOrder[];
  totalActive: number;
  totalReady: number;
  stats: { receivedToday: number; completedToday: number; revenueToday: number };
  appointments: Appointment[];
  engineerWorkload: EngineerLoad[];
  lowStock: LowStock[];
  activityLogs: ActivityLog[];
  generatedAt: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isOverdue(slaDeadline: string | null): boolean {
  if (!slaDeadline) return false;
  return new Date(slaDeadline) < new Date();
}

function statusColor(status: string): string {
  switch (status) {
    case "RECEIVED":    return "bg-blue-500/20 text-blue-300 border-blue-500/40";
    case "IN_PROGRESS": return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    case "DONE":        return "bg-green-500/20 text-green-300 border-green-500/40";
    default:            return "bg-slate-600/30 text-slate-300 border-slate-500/40";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "RECEIVED":    return "Received";
    case "IN_PROGRESS": return "In Progress";
    default:            return status;
  }
}

function firstNameOnly(fullName: string): string {
  return fullName.split(" ")[0];
}

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen({ error }: { error?: string }) {
  return (
    <div className="fixed inset-0 bg-[#0a0c10] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
        {error
          ? <p className="text-red-400 text-xl">{error}</p>
          : <p className="text-slate-400 text-xl">Loading TV Dashboard…</p>
        }
      </div>
    </div>
  );
}

// ─── Components ──────────────────────────────────────────────────────────────

function ActiveRepairCard({ order, index }: { order: ActiveOrder; index: number }) {
  const overdue = isOverdue(order.slaDeadline);
  return (
    <div className={`
      rounded-xl border p-4 transition-all
      ${overdue
        ? "border-red-500/60 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
        : "border-slate-700/60 bg-slate-800/60"}
    `}
      style={{ animationDelay: `${index * 60}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-blue-400 font-mono font-bold" style={{ fontSize: 22 }}>
              {order.orderNumber}
            </span>
            {overdue && (
              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                OVERDUE
              </span>
            )}
          </div>
          <p className="text-white font-semibold mt-0.5" style={{ fontSize: 20 }}>
            {firstNameOnly(order.customerName)}
          </p>
          <p className="text-slate-400 mt-0.5" style={{ fontSize: 15 }}>
            {order.deviceBrand} {order.deviceModel}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={`border rounded-lg px-2.5 py-1 text-xs font-semibold ${statusColor(order.status)}`}>
            {statusLabel(order.status)}
          </span>
          <span className="text-slate-500 text-xs">{timeAgo(order.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

function ReadyCard({ order, index }: { order: ReadyOrder; index: number }) {
  return (
    <div
      className="rounded-2xl border border-green-500/40 bg-green-500/10 p-5 ready-pulse"
      style={{ animationDelay: `${(index % 3) * 400}ms` }}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-green-300 font-mono font-bold" style={{ fontSize: 26 }}>
            {order.orderNumber}
          </p>
          <p className="text-white font-bold mt-1" style={{ fontSize: 22 }}>
            {order.customerName}
          </p>
          <p className="text-slate-400 mt-0.5" style={{ fontSize: 14 }}>
            {order.deviceBrand} {order.deviceModel}
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function TvDashboardContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [data, setData] = useState<TvData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clock, setClock] = useState(new Date());
  const [activePage, setActivePage] = useState(0);
  const [tickerOffset, setTickerOffset] = useState(0);
  const scrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) { setError("No token — add ?token=YOUR_TV_TOKEN to the URL"); return; }
    try {
      const res = await fetch(`/api/tv/data?token=${encodeURIComponent(token)}`);
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to load");
        return;
      }
      const d: TvData = await res.json();
      setData(d);
      setError(null);
    } catch {
      setError("Connection error — retrying…");
    }
  }, [token]);

  // Initial fetch + 30s interval
  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 30000);
    return () => clearInterval(iv);
  }, [fetchData]);

  // Live clock
  useEffect(() => {
    const iv = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Auto-scroll active orders every 10s if there are more than 8
  useEffect(() => {
    if (!data) return;
    if (scrollTimerRef.current) clearInterval(scrollTimerRef.current);
    if (data.activeOrders.length > 8) {
      scrollTimerRef.current = setInterval(() => {
        setActivePage(p => {
          const maxPage = Math.ceil(data.activeOrders.length / 8) - 1;
          return p >= maxPage ? 0 : p + 1;
        });
      }, 10000);
    }
    return () => { if (scrollTimerRef.current) clearInterval(scrollTimerRef.current); };
  }, [data]);

  if (error) return <LoadingScreen error={error} />;
  if (!data) return <LoadingScreen />;

  const { shop, activeOrders, readyOrders, totalActive, totalReady, stats, appointments, engineerWorkload, lowStock, activityLogs } = data;

  const pageOrders = activeOrders.slice(activePage * 8, activePage * 8 + 8);

  const bookingUrl = `https://fixflow-ruddy.vercel.app/book/${shop.id}`;

  const tickerText = activityLogs.map(l =>
    `${l.workOrder.orderNumber} — ${l.workOrder.customerName} — ${l.description ?? l.action} (${timeAgo(l.createdAt)})`
  ).join("    •    ");

  const overdueCnt = activeOrders.filter(o => isOverdue(o.slaDeadline)).length;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0a0c10; overflow: hidden; height: 100%; }
        @keyframes readyPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
          50% { box-shadow: 0 0 20px 4px rgba(34,197,94,0.25); }
        }
        .ready-pulse { animation: readyPulse 2s ease-in-out infinite; }
        @keyframes ticker {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .ticker-track { animation: ticker 60s linear infinite; white-space: nowrap; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        @keyframes dotPulse {
          0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
        }
        .live-dot { animation: dotPulse 1.5s ease-in-out infinite; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="fixed inset-0 flex flex-col bg-[#0a0c10] text-white overflow-hidden select-none"
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

        {/* ── TOP BAR ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-8 py-4 bg-slate-900/80 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-4">
            {shop.logoUrl && (
              <img src={shop.logoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-cover border border-slate-700" />
            )}
            <div>
              <h1 className="text-white font-bold leading-tight" style={{ fontSize: 28 }}>{shop.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="live-dot w-2 h-2 bg-green-400 rounded-full inline-block" />
                <span className="text-green-400 text-sm font-medium">Live Display</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-white font-bold tabular-nums leading-none" style={{ fontSize: 56 }}>
              {clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="text-slate-400 text-base mt-0.5">
              {clock.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {overdueCnt > 0 && (
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 px-4 py-2 rounded-xl animate-pulse">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <span className="text-red-300 font-bold text-lg">{overdueCnt} Overdue</span>
              </div>
            )}
            <div className="text-right">
              <div className="text-slate-400 text-sm">Auto-refresh</div>
              <div className="text-slate-300 text-sm font-medium">every 30s</div>
            </div>
          </div>
        </div>

        {/* ── MAIN COLUMNS ─────────────────────────────────────────────── */}
        <div className="flex flex-1 gap-0 overflow-hidden">

          {/* LEFT — Active Repairs (40%) */}
          <div className="flex flex-col border-r border-slate-800" style={{ width: "40%" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/40 flex-shrink-0">
              <div>
                <h2 className="font-bold text-slate-100" style={{ fontSize: 22 }}>Active Repairs</h2>
                <p className="text-slate-500 text-sm mt-0.5">In progress · awaiting repair</p>
              </div>
              <div className="flex items-center gap-3">
                {activeOrders.length > 8 && (
                  <span className="text-xs text-slate-500">
                    Page {activePage + 1}/{Math.ceil(activeOrders.length / 8)}
                  </span>
                )}
                <span className="text-white font-bold text-2xl bg-slate-700/80 px-3 py-1 rounded-lg">
                  {totalActive}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-hidden p-4 space-y-3">
              {pageOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600">
                  <svg className="w-16 h-16 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p style={{ fontSize: 20 }}>No active repairs</p>
                </div>
              ) : (
                pageOrders.map((order, i) => (
                  <div key={order.id} className="fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                    <ActiveRepairCard order={order} index={i} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CENTER — Ready for Pickup (30%) */}
          <div className="flex flex-col border-r border-slate-800" style={{ width: "30%" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-green-950/20 flex-shrink-0">
              <div>
                <h2 className="font-bold text-green-300" style={{ fontSize: 22 }}>Ready for Pickup</h2>
                <p className="text-slate-500 text-sm mt-0.5">Waiting for customer</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-green-300 font-bold text-2xl bg-green-500/20 px-3 py-1 rounded-lg">
                  {totalReady}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {readyOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600">
                  <svg className="w-16 h-16 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p style={{ fontSize: 20 }}>All clear!</p>
                </div>
              ) : (
                readyOrders.map((order, i) => (
                  <div key={order.id} className="fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                    <ReadyCard order={order} index={i} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT — Stats + Appointments + Engineers + Stock (30%) */}
          <div className="flex flex-col overflow-y-auto" style={{ width: "30%" }}>

            {/* Today's Stats */}
            <div className="px-5 py-4 border-b border-slate-800">
              <h2 className="font-bold text-slate-400 text-sm uppercase tracking-widest mb-3">Today&apos;s Stats</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Received",  value: stats.receivedToday,  color: "text-blue-400",   bg: "bg-blue-500/10" },
                  { label: "Completed", value: stats.completedToday, color: "text-green-400",  bg: "bg-green-500/10" },
                  { label: "Revenue",   value: `${stats.revenueToday.toLocaleString()}`, color: "text-amber-400", bg: "bg-amber-500/10" },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                    <div className={`${s.color} font-bold leading-none`} style={{ fontSize: 32 }}>{s.value}</div>
                    <div className="text-slate-500 text-xs mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Appointments */}
            {appointments.length > 0 && (
              <div className="px-5 py-4 border-b border-slate-800">
                <h2 className="font-bold text-slate-400 text-sm uppercase tracking-widest mb-3">Upcoming Today</h2>
                <div className="space-y-2">
                  {appointments.map(appt => (
                    <div key={appt.id} className="flex items-center gap-3 py-2 border-b border-slate-800/50 last:border-0">
                      <div className="text-blue-300 font-mono font-bold text-lg w-14 flex-shrink-0">
                        {formatTime(appt.scheduledAt)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-base truncate">{appt.customerName}</p>
                        <p className="text-slate-500 text-sm truncate">{appt.deviceBrand} {appt.deviceModel}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 border ${
                        appt.status === "CONFIRMED" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      }`}>{appt.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Engineers */}
            {engineerWorkload.length > 0 && (
              <div className="px-5 py-4 border-b border-slate-800">
                <h2 className="font-bold text-slate-400 text-sm uppercase tracking-widest mb-3">Engineers</h2>
                <div className="space-y-2">
                  {engineerWorkload.map((eng, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-slate-300 text-sm font-bold">{eng.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-base truncate">{eng.name}</p>
                        {eng.orders[0] && <p className="text-slate-500 text-xs truncate">{eng.orders[0]}</p>}
                      </div>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        eng.count === 0 ? "bg-slate-700 text-slate-500" : "bg-blue-500/20 text-blue-300"
                      }`}>
                        {eng.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Low stock */}
            {lowStock.length > 0 && (
              <div className="px-5 py-4 border-b border-slate-800">
                <h2 className="font-bold text-amber-400/80 text-sm uppercase tracking-widest mb-3">
                  ⚠ Low Stock
                </h2>
                <div className="space-y-2">
                  {lowStock.map(part => (
                    <div key={part.id} className="flex items-center justify-between gap-2">
                      <p className="text-slate-300 text-base truncate flex-1">{part.name}</p>
                      <span className={`font-bold text-lg flex-shrink-0 ${part.stock === 0 ? "text-red-400" : "text-amber-400"}`}>
                        {part.stock}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QR code for booking */}
            <div className="mt-auto px-5 py-5 flex items-center gap-4">
              <div className="bg-white p-2 rounded-xl flex-shrink-0">
                <QRCode value={bookingUrl} size={80} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Book a Repair</p>
                <p className="text-slate-300 text-sm mt-1 leading-snug">Scan to book<br />your appointment</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTTOM TICKER ────────────────────────────────────────────── */}
        <div className="flex items-center border-t border-slate-800 bg-slate-900/80 py-2.5 flex-shrink-0 overflow-hidden">
          <div className="px-3 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded mr-3 ml-4 flex-shrink-0">
            Live
          </div>
          <div className="flex-1 overflow-hidden relative h-5">
            <div className="ticker-track absolute top-0 left-0 flex items-center h-full">
              <span className="text-slate-400 text-sm">{tickerText || "No recent activity"}</span>
            </div>
          </div>
          <div className="flex-shrink-0 px-4 text-slate-600 text-xs font-medium">
            Powered by FixFlow
          </div>
        </div>
      </div>
    </>
  );
}

export default function TvDashboardPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <TvDashboardContent />
    </Suspense>
  );
}
