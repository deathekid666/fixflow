"use client";
import { useEffect, useState, Fragment } from "react";

type ShopInfo = {
  id: string;
  name: string;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  availability: { dayOfWeek: number; isOpen: boolean }[];
  closures: string[];
};

type Slot = { time: string; available: boolean; remaining: number };

type Booked = {
  id: string;
  customerName: string;
  scheduledAt: string;
  deviceBrand: string;
  deviceModel: string;
};

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateStr(s: string): string {
  const d = new Date(s + "T00:00:00");
  return `${DAY_SHORT[d.getDay()]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function BookPage({ params }: { params: { shopId: string } }) {
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [closedMsg, setClosedMsg] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deviceBrand, setDeviceBrand] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [faultDescription, setFaultDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [booked, setBooked] = useState<Booked | null>(null);

  useEffect(() => {
    fetch(`/api/public/shops/${params.shopId}`)
      .then(r => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
      .then(d => { if (d) setShop(d); })
      .finally(() => setLoadingShop(false));
  }, []);

  const next14 = (() => {
    const result: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      result.push(d);
    }
    return result;
  })();

  function isDisabled(date: Date): boolean {
    if (!shop) return true;
    const dow = date.getDay();
    const avail = shop.availability.find(a => a.dayOfWeek === dow);
    if (!avail?.isOpen) return true;
    if (shop.closures.includes(toDateStr(date))) return true;
    return false;
  }

  async function pickDate(dateStr: string) {
    setSelectedDate(dateStr);
    setSelectedTime("");
    setClosedMsg("");
    setSlots([]);
    setStep(2);
    setLoadingSlots(true);
    const res = await fetch(`/api/appointments/slots?shopId=${params.shopId}&date=${dateStr}`);
    const data = await res.json();
    if (data.closed) setClosedMsg(data.reason ?? "Closed");
    else setSlots(data.slots ?? []);
    setLoadingSlots(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    setSubmitError("");
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopId: params.shopId,
        customerName, customerPhone, deviceBrand, deviceModel, faultDescription,
        scheduledAt: new Date(`${selectedDate}T${selectedTime}:00.000Z`).toISOString(),
      }),
    });
    if (res.ok) { setBooked(await res.json()); setStep(4); }
    else { const d = await res.json(); setSubmitError(d.error ?? "Failed to book. Please try again."); }
    setSubmitting(false);
  }

  // ─── shared style helpers ───────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
    padding: "11px 14px", color: "white", fontSize: 14,
    outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 6 };
  const btnReady: React.CSSProperties = {
    width: "100%", padding: "13px 0", background: "#2563eb",
    border: "none", borderRadius: 12, color: "white",
    fontSize: 15, fontWeight: 700, cursor: "pointer",
  };
  const btnGray: React.CSSProperties = { ...btnReady, background: "rgba(37,99,235,0.3)", color: "rgba(255,255,255,0.3)", cursor: "not-allowed" };

  // ─── loading / not found ────────────────────────────────────────────────────
  if (loadingShop) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#64748b", fontSize: 14, fontFamily: "'Segoe UI',sans-serif" }}>Loading...</p>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ ...card, textAlign: "center", maxWidth: 340, fontFamily: "'Segoe UI',sans-serif" }}>
        <p style={{ fontSize: 40, margin: "0 0 12px" }}>🔍</p>
        <p style={{ color: "#f87171", fontWeight: 700, fontSize: 16, margin: "0 0 6px" }}>Shop Not Found</p>
        <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>This booking link is invalid or expired.</p>
      </div>
    </div>
  );

  const todayStr = toDateStr(new Date());
  const firstDayOfWeek = next14[0].getDay(); // offset for calendar grid

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", fontFamily: "'Segoe UI',Arial,sans-serif", padding: "24px 16px 60px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        {/* ── Shop header ── */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.06)", borderRadius: 99, padding: "10px 22px", marginBottom: 10 }}>
            {shop?.logoUrl
              ? <img src={shop.logoUrl} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
              : <span style={{ fontSize: 20 }}>🔧</span>}
            <span style={{ color: "white", fontWeight: 700, fontSize: 18 }}>{shop?.name}</span>
          </div>
          {shop?.address && (
            <p style={{ color: "#475569", fontSize: 12, margin: "0 0 6px" }}>📍 {shop.address}</p>
          )}
          <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>Book an Appointment</p>
          {shop?.googleMapsUrl && (
            <div style={{ marginTop: 10 }}>
              <a
                href={shop.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 99, padding: "7px 18px",
                  color: "#94a3b8", fontSize: 13, fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                🗺 View on Maps
              </a>
            </div>
          )}
        </div>

        {/* ── Step indicator ── */}
        {step < 4 && (
          <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
            {([1, 2, 3] as const).map((s, i) => (
              <Fragment key={s}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                  background: step >= s ? "#2563eb" : "rgba(255,255,255,0.07)",
                  color: step >= s ? "white" : "#334155",
                }}>
                  {step > s ? "✓" : s}
                </div>
                {i < 2 && <div style={{ flex: 1, height: 2, background: step > s ? "#2563eb" : "rgba(255,255,255,0.07)" }} />}
              </Fragment>
            ))}
          </div>
        )}

        {/* ── Step 1: Date picker ── */}
        {step === 1 && (
          <div style={{ ...card }}>
            <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "white" }}>Select a Date</p>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: "#475569" }}>
              {MONTH_SHORT[next14[0].getMonth()]} – {MONTH_SHORT[next14[13].getMonth()]} {next14[13].getFullYear()}
            </p>

            {/* Day-of-week headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 4 }}>
              {DAY_SHORT.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 10, color: "#334155", fontWeight: 600, paddingBottom: 2 }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid with leading spacers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
              {Array.from({ length: firstDayOfWeek }, (_, i) => <div key={`sp-${i}`} />)}
              {next14.map(date => {
                const ds = toDateStr(date);
                const disabled = isDisabled(date);
                const isToday = ds === todayStr;
                return (
                  <button
                    key={ds}
                    onClick={() => !disabled && pickDate(ds)}
                    disabled={disabled}
                    style={{
                      aspectRatio: "1",
                      borderRadius: 10,
                      border: `1px solid ${disabled ? "rgba(255,255,255,0.04)" : isToday ? "#3b82f6" : "rgba(255,255,255,0.1)"}`,
                      background: disabled ? "transparent" : "rgba(255,255,255,0.05)",
                      color: disabled ? "#1e293b" : "white",
                      fontSize: 13, fontWeight: isToday ? 700 : 400,
                      cursor: disabled ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 0.12s",
                      position: "relative",
                    }}
                    onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = "rgba(37,99,235,0.3)"; }}
                    onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
                  >
                    {date.getDate()}
                    {isToday && !disabled && (
                      <span style={{ position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: "#3b82f6" }} />
                    )}
                  </button>
                );
              })}
            </div>
            <p style={{ marginTop: 12, fontSize: 11, color: "#1e293b", textAlign: "center" }}>Dimmed dates are unavailable</p>
          </div>
        )}

        {/* ── Step 2: Time slots ── */}
        {step === 2 && (
          <div style={{ ...card }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 0 }}>←</button>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "white" }}>Choose a Time</p>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{formatDateStr(selectedDate)}</p>
              </div>
            </div>

            {loadingSlots && (
              <div style={{ textAlign: "center", padding: "36px 0" }}>
                <p style={{ color: "#475569", fontSize: 13 }}>Loading available slots...</p>
              </div>
            )}

            {!loadingSlots && closedMsg && (
              <div style={{ textAlign: "center", padding: "36px 0" }}>
                <p style={{ fontSize: 36, margin: "0 0 10px" }}>🚫</p>
                <p style={{ color: "#f87171", fontWeight: 600, fontSize: 14, margin: "0 0 4px" }}>Not available</p>
                <p style={{ color: "#475569", fontSize: 12, margin: "0 0 20px" }}>{closedMsg}</p>
                <button onClick={() => setStep(1)} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#94a3b8", fontSize: 13, padding: "9px 20px", cursor: "pointer" }}>
                  ← Pick another date
                </button>
              </div>
            )}

            {!loadingSlots && !closedMsg && slots.length === 0 && (
              <div style={{ textAlign: "center", padding: "36px 0" }}>
                <p style={{ color: "#475569", fontSize: 13, margin: "0 0 20px" }}>No slots available for this date.</p>
                <button onClick={() => setStep(1)} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#94a3b8", fontSize: 13, padding: "9px 20px", cursor: "pointer" }}>
                  ← Pick another date
                </button>
              </div>
            )}

            {!loadingSlots && slots.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                {slots.map(slot => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && (setSelectedTime(slot.time), setStep(3))}
                    disabled={!slot.available}
                    style={{
                      padding: "11px 6px",
                      borderRadius: 10,
                      border: `1px solid ${slot.available ? "rgba(37,99,235,0.45)" : "rgba(255,255,255,0.05)"}`,
                      background: slot.available ? "rgba(37,99,235,0.15)" : "transparent",
                      color: slot.available ? "white" : "#1e293b",
                      cursor: slot.available ? "pointer" : "not-allowed",
                      fontSize: 13, fontWeight: 600, textAlign: "center",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => { if (slot.available) (e.currentTarget as HTMLButtonElement).style.background = "rgba(37,99,235,0.35)"; }}
                    onMouseLeave={e => { if (slot.available) (e.currentTarget as HTMLButtonElement).style.background = "rgba(37,99,235,0.15)"; }}
                  >
                    {formatTime(slot.time)}
                    {!slot.available && <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>Full</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Details form ── */}
        {step === 3 && (
          <form onSubmit={submit} style={{ ...card, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button type="button" onClick={() => setStep(2)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 0 }}>←</button>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "white" }}>Your Details</p>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{formatDateStr(selectedDate)} · {formatTime(selectedTime)}</p>
              </div>
            </div>

            {submitError && (
              <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#f87171" }}>
                {submitError}
              </div>
            )}

            <div>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Your name" required autoComplete="name" />
            </div>
            <div>
              <label style={labelStyle}>Phone Number *</label>
              <input style={inputStyle} value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+212 6xx xxx xxx" required type="tel" autoComplete="tel" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Device Brand *</label>
                <input style={inputStyle} value={deviceBrand} onChange={e => setDeviceBrand(e.target.value)} placeholder="Apple, Samsung…" required />
              </div>
              <div>
                <label style={labelStyle}>Model *</label>
                <input style={inputStyle} value={deviceModel} onChange={e => setDeviceModel(e.target.value)} placeholder="iPhone 15…" required />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Issue Description *</label>
              <textarea
                style={{ ...inputStyle, resize: "none", minHeight: 80 }}
                value={faultDescription}
                onChange={e => setFaultDescription(e.target.value)}
                placeholder="Describe what's wrong…"
                required
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !customerName || !customerPhone || !deviceBrand || !deviceModel || !faultDescription}
              style={submitting || !customerName || !customerPhone || !deviceBrand || !deviceModel || !faultDescription ? btnGray : btnReady}
            >
              {submitting ? "Booking…" : "Confirm Appointment"}
            </button>
          </form>
        )}

        {/* ── Step 4: Confirmation ── */}
        {step === 4 && booked && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Success banner */}
            <div style={{ background: "linear-gradient(135deg,#14532d,#166534)", border: "2px solid #22c55e", borderRadius: 20, padding: "28px 20px", textAlign: "center", boxShadow: "0 0 40px rgba(34,197,94,0.2)" }}>
              <div style={{ fontSize: 52, marginBottom: 10 }}>✅</div>
              <p style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 900, color: "#bbf7d0", letterSpacing: "-0.02em" }}>Appointment Booked!</p>
              <p style={{ margin: 0, fontSize: 14, color: "#86efac" }}>We'll contact you to confirm.</p>
            </div>

            {/* Details card */}
            <div style={{ ...card }}>
              <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>Booking Summary</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Shop", value: shop?.name ?? "" },
                  { label: "Date & Time", value: `${formatDateStr(selectedDate)} at ${formatTime(selectedTime)}` },
                  { label: "Name", value: customerName },
                  { label: "Phone", value: customerPhone },
                  { label: "Device", value: `${deviceBrand} ${deviceModel}` },
                  { label: "Issue", value: faultDescription },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "#475569", flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 13, color: "white", fontWeight: 500, textAlign: "right" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Track repair note */}
            <div style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 16, padding: 18, textAlign: "center" }}>
              <p style={{ fontSize: 24, margin: "0 0 8px" }}>🔍</p>
              <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#93c5fd" }}>Track Your Repair</p>
              <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                Once your device is checked in, you'll receive a repair order number via the shop — use it at{" "}
                <span style={{ color: "#60a5fa" }}>fixflow.ma/track</span>{" "}
                to follow your repair progress in real time.
              </p>
            </div>

            {/* Call shop */}
            {shop?.phone && (
              <div style={{ textAlign: "center" }}>
                <a href={`tel:${shop.phone}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 99, padding: "10px 24px", color: "#94a3b8", fontSize: 13, textDecoration: "none" }}>
                  📞 Call {shop.name}: {shop.phone}
                </a>
              </div>
            )}
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 11, color: "#1e293b", marginTop: 24 }}>
          Powered by <strong style={{ color: "#334155" }}>FixFlow</strong>
        </p>
      </div>
    </div>
  );
}
