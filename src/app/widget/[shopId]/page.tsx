"use client";
import { useEffect, useState } from "react";

type ShopInfo = {
  id: string;
  name: string;
  logoUrl: string | null;
  phone: string | null;
};

export default function WidgetPage({ params }: { params: { shopId: string } }) {
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    fetch(`/api/public/shops/${params.shopId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setShop(d); })
      .catch(() => {});
  }, []);

  function track() {
    if (!orderNumber.trim()) return;
    window.open(`/track/${orderNumber.trim().toLowerCase()}`, "_blank");
  }

  const bookingUrl = `https://fixflow-ruddy.vercel.app/book/${params.shopId}`;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)",
      fontFamily: "'Segoe UI', Arial, sans-serif",
      display: "flex",
      flexDirection: "column",
      padding: "20px 16px",
      boxSizing: "border-box",
    }}>

      {/* Shop header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
          {shop?.logoUrl
            ? <img src={shop.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            : <span style={{ fontSize: 18 }}>🔧</span>}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "white" }}>{shop?.name ?? "Repair Shop"}</p>
          <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Powered by FixFlow</p>
        </div>
      </div>

      {/* Track repair section */}
      <div style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: "18px 16px",
        marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>🔍</span>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "white" }}>Track Your Repair</p>
            <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Enter your order number below</p>
          </div>
        </div>
        <input
          value={orderNumber}
          onChange={e => setOrderNumber(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") track(); }}
          placeholder="e.g. WO-2026-A1B2C3"
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            padding: "10px 14px",
            color: "white",
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
            marginBottom: 10,
          }}
        />
        <button
          onClick={track}
          disabled={!orderNumber.trim()}
          style={{
            width: "100%",
            padding: "11px 0",
            background: orderNumber.trim() ? "#2563eb" : "rgba(37,99,235,0.3)",
            border: "none",
            borderRadius: 10,
            color: orderNumber.trim() ? "white" : "rgba(255,255,255,0.3)",
            fontSize: 14,
            fontWeight: 700,
            cursor: orderNumber.trim() ? "pointer" : "not-allowed",
            transition: "background 0.15s",
          }}
        >
          Track Repair →
        </button>
      </div>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        <span style={{ fontSize: 11, color: "#334155", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>or</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
      </div>

      {/* Book appointment CTA */}
      <a
        href={bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "14px 0",
          background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
          borderRadius: 14,
          color: "white",
          fontSize: 15,
          fontWeight: 700,
          textDecoration: "none",
          boxShadow: "0 4px 20px rgba(16,185,129,0.3)",
          transition: "opacity 0.15s",
          marginBottom: 16,
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
      >
        <span style={{ fontSize: 20 }}>📅</span>
        Book an Appointment
      </a>

      {/* Info rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
        {shop?.phone && (
          <a href={`tel:${shop.phone}`}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, color: "#94a3b8", fontSize: 13, textDecoration: "none" }}>
            <span>📞</span> {shop.phone}
          </a>
        )}
        <p style={{ textAlign: "center", fontSize: 10, color: "#1e293b", margin: 0 }}>
          Powered by <strong style={{ color: "#334155" }}>FixFlow</strong>
        </p>
      </div>
    </div>
  );
}
