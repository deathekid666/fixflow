"use client";
import { useEffect, useState } from "react";

type Shop = {
  id: string;
  name: string;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
  googleMapsUrl: string | null;
};

export default function ShopsDirectoryPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/public/shops")
      .then(r => r.ok ? r.json() : [])
      .then(setShops)
      .finally(() => setLoading(false));
  }, []);

  const filtered = shops.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.address ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const S = {
    page: { minHeight: "100vh", background: "linear-gradient(160deg,#0f172a 0%,#1e293b 100%)", fontFamily: "'Segoe UI',Arial,sans-serif", padding: "32px 16px 60px" } as React.CSSProperties,
    inner: { maxWidth: 900, margin: "0 auto" } as React.CSSProperties,
    card: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 20, display: "flex", flexDirection: "column" as const, gap: 14 } as React.CSSProperties,
  };

  return (
    <div style={S.page}>
      <div style={S.inner}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <p style={{ fontSize: 13, color: "#3b82f6", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>Powered by FixFlow</p>
          <h1 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 900, color: "white", letterSpacing: "-0.02em" }}>Repair Shops Directory</h1>
          <p style={{ margin: 0, fontSize: 15, color: "#64748b" }}>Find a trusted repair shop near you</p>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 28, position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or location..."
            style={{
              width: "100%", boxSizing: "border-box",
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12, padding: "12px 14px 12px 42px",
              color: "white", fontSize: 14, outline: "none",
            }}
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ ...S.card, opacity: 0.5 }}>
                <div style={{ height: 48, background: "rgba(255,255,255,0.06)", borderRadius: 10 }} />
                <div style={{ height: 14, background: "rgba(255,255,255,0.06)", borderRadius: 6, width: "60%" }} />
                <div style={{ height: 36, background: "rgba(255,255,255,0.04)", borderRadius: 10 }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: 40, margin: "0 0 12px" }}>🔧</p>
            <p style={{ color: "#64748b", fontSize: 15 }}>{search ? "No shops match your search." : "No shops listed yet."}</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
            {filtered.map(shop => (
              <div key={shop.id} style={S.card}>
                {/* Shop identity */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {shop.logoUrl
                      ? <img src={shop.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      : <span style={{ fontSize: 22 }}>🔧</span>}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{shop.name}</p>
                    {shop.address && (
                      <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>📍 {shop.address}</p>
                    )}
                    {shop.phone && (
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>📞 {shop.phone}</p>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 8 }}>
                  <a
                    href={`/book/${shop.id}`}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "10px 0", background: "linear-gradient(135deg,#2563eb,#3b82f6)",
                      borderRadius: 10, color: "white", fontSize: 13, fontWeight: 700,
                      textDecoration: "none", transition: "opacity 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >
                    📅 Book
                  </a>
                  {shop.googleMapsUrl ? (
                    <a
                      href={shop.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "10px 0", background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10, color: "#94a3b8", fontSize: 13, fontWeight: 600,
                        textDecoration: "none", transition: "background 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                    >
                      🗺 Directions
                    </a>
                  ) : (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 0", borderRadius: 10, background: "rgba(255,255,255,0.03)", color: "#334155", fontSize: 13 }}>
                      No map
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 11, color: "#1e293b", marginTop: 40 }}>
          Powered by <strong style={{ color: "#334155" }}>FixFlow</strong>
        </p>
      </div>
    </div>
  );
}
