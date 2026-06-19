"use client";
import { useEffect, useState } from "react";

type ShopInfo = {
  id: string;
  name: string;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
};

type Appointment = {
  id: string;
  customerName: string;
  customerPhone: string;
  deviceBrand: string;
  deviceModel: string;
  scheduledAt: string;
  faultDescription: string;
  status: string;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)",
    fontFamily: "'Segoe UI', Arial, sans-serif",
    padding: "24px 16px 60px",
    boxSizing: "border-box",
  },
  wrap: { maxWidth: 420, margin: "0 auto" },
  card: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
  },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "11px 14px",
    color: "white",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  label: { display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 6 },
  btn: {
    width: "100%",
    padding: "13px 0",
    background: "#2563eb",
    border: "none",
    borderRadius: 12,
    color: "white",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  btnDisabled: {
    width: "100%",
    padding: "13px 0",
    background: "rgba(37,99,235,0.3)",
    border: "none",
    borderRadius: 12,
    color: "rgba(255,255,255,0.3)",
    fontSize: 15,
    fontWeight: 700,
    cursor: "not-allowed",
  },
};

export default function CheckinPage({ params }: { params: { shopId: string } }) {
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ appointment: Appointment | null; walkIn?: boolean } | null>(null);

  useEffect(() => {
    fetch(`/api/public/shops/${params.shopId}`)
      .then(r => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
      .then(d => { if (d) setShop(d); });
  }, []);

  async function handleCheckin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/public/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId: params.shopId, phone: phone.trim(), customerName: name.trim() }),
    });

    if (res.ok) {
      setResult(await res.json());
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  if (notFound) return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...s.card, textAlign: "center", maxWidth: 340 }}>
        <p style={{ fontSize: 40, margin: "0 0 12px" }}>🔍</p>
        <p style={{ color: "#f87171", fontWeight: 700, fontSize: 16, margin: "0 0 6px" }}>Shop Not Found</p>
        <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>This check-in link is invalid or expired.</p>
      </div>
    </div>
  );

  // ── Confirmed screen ──────────────────────────────────────────────────────
  if (result) {
    const appt = result.appointment;
    return (
      <div style={s.page}>
        <div style={s.wrap}>
          {/* Shop header */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.06)", borderRadius: 99, padding: "10px 22px", marginBottom: 8 }}>
              {shop?.logoUrl
                ? <img src={shop.logoUrl} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
                : <span style={{ fontSize: 20 }}>🔧</span>}
              <span style={{ color: "white", fontWeight: 700, fontSize: 17 }}>{shop?.name}</span>
            </div>
          </div>

          {/* Success card */}
          <div style={{ background: "linear-gradient(135deg,#14532d,#166534)", border: "2px solid #22c55e", borderRadius: 20, padding: "28px 20px", textAlign: "center", boxShadow: "0 0 40px rgba(34,197,94,0.2)", marginBottom: 16 }}>
            <div style={{ fontSize: 52, marginBottom: 10 }}>✅</div>
            <p style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 900, color: "#bbf7d0", letterSpacing: "-0.02em" }}>You're Checked In!</p>
            <p style={{ margin: 0, fontSize: 14, color: "#86efac" }}>
              {appt ? "Your appointment is confirmed. The team has been notified." : "Welcome! Please let the staff know you've arrived."}
            </p>
          </div>

          {/* Appointment details */}
          {appt && (
            <div style={{ ...s.card, marginBottom: 16 }}>
              <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>Appointment Details</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Name",    value: appt.customerName },
                  { label: "Time",    value: formatTime(appt.scheduledAt) },
                  { label: "Device",  value: `${appt.deviceBrand} ${appt.deviceModel}` },
                  { label: "Issue",   value: appt.faultDescription },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ fontSize: 12, color: "#475569", flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 13, color: "white", fontWeight: 500, textAlign: "right" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Walk-in notice */}
          {result.walkIn && !appt && (
            <div style={{ ...s.card, textAlign: "center", marginBottom: 16 }}>
              <p style={{ fontSize: 24, margin: "0 0 8px" }}>👋</p>
              <p style={{ color: "white", fontWeight: 600, fontSize: 14, margin: "0 0 4px" }}>Walk-In Recorded</p>
              <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>No appointment found for today. A staff member will be with you shortly.</p>
            </div>
          )}

          {/* Call shop */}
          {shop?.phone && (
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <a href={`tel:${shop.phone}`}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 99, padding: "10px 24px", color: "#94a3b8", fontSize: 13, textDecoration: "none" }}>
                📞 Call {shop.name}
              </a>
            </div>
          )}

          <p style={{ textAlign: "center", fontSize: 11, color: "#1e293b", margin: 0 }}>
            Powered by <strong style={{ color: "#334155" }}>FixFlow</strong>
          </p>
        </div>
      </div>
    );
  }

  // ── Check-in form ─────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.wrap}>
        {/* Shop header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.06)", borderRadius: 99, padding: "10px 22px", marginBottom: 8 }}>
            {shop?.logoUrl
              ? <img src={shop.logoUrl} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
              : <span style={{ fontSize: 20 }}>🔧</span>}
            <span style={{ color: "white", fontWeight: 700, fontSize: 17 }}>{shop?.name ?? "Repair Shop"}</span>
          </div>
          {shop?.address && (
            <p style={{ color: "#475569", fontSize: 12, margin: "4px 0 0" }}>📍 {shop.address}</p>
          )}
          <p style={{ color: "#64748b", fontSize: 13, margin: "6px 0 0" }}>Customer Check-In</p>
        </div>

        {/* Welcome */}
        <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 16, padding: "16px 20px", marginBottom: 20, textAlign: "center" }}>
          <p style={{ fontSize: 28, margin: "0 0 6px" }}>👋</p>
          <p style={{ color: "#93c5fd", fontWeight: 700, fontSize: 15, margin: "0 0 4px" }}>Welcome!</p>
          <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>Enter your details so the team knows you've arrived.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleCheckin} style={{ ...s.card, display: "flex", flexDirection: "column", gap: 14 }}>
          {error && (
            <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#f87171" }}>
              {error}
            </div>
          )}

          <div>
            <label style={s.label}>Your Full Name *</label>
            <input
              style={s.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              required
              autoComplete="name"
            />
          </div>

          <div>
            <label style={s.label}>Phone Number *</label>
            <input
              style={s.input}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+212 6xx xxx xxx"
              required
              type="tel"
              autoComplete="tel"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !name.trim() || !phone.trim()}
            style={submitting || !name.trim() || !phone.trim() ? s.btnDisabled : s.btn}
          >
            {submitting ? "Checking in…" : "Check In ✓"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 11, color: "#1e293b", margin: "20px 0 0" }}>
          Powered by <strong style={{ color: "#334155" }}>FixFlow</strong>
        </p>
      </div>
    </div>
  );
}
