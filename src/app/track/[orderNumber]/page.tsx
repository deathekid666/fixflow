"use client";

import { useEffect, useState } from "react";

type TrackData = {
  id: string;
  orderNumber: string;
  deviceBrand: string;
  deviceModel: string;
  customerName: string;
  status: string;
  receivedAt: string;
  doneAt: string | null;
  deliveredAt: string | null;
  faultDescription: string;
  repairType: string | null;
  assignee: { name: string } | null;
  shop: { name: string; phone: string | null; address: string | null } | null;
  logs: { action: string; description: string; createdAt: string }[];
  rating: { rating: number; comment: string | null } | null;
};

const STATUS_STEPS = ["RECEIVED", "DIAGNOSING", "REPAIRING", "DONE", "DELIVERED"];

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; message: string }> = {
  RECEIVED: { label: "Received", icon: "📥", color: "#2563eb", bg: "#dbeafe", message: "We've received your device and will begin diagnosis shortly." },
  DIAGNOSING: { label: "Diagnosing", icon: "🔍", color: "#d97706", bg: "#fef3c7", message: "Our technician is diagnosing your device to identify the issue." },
  REPAIRING: { label: "In Repair", icon: "🔧", color: "#ea580c", bg: "#ffedd5", message: "Your device is currently being repaired by our technician." },
  DONE: { label: "Ready for Pickup", icon: "✅", color: "#16a34a", bg: "#dcfce7", message: "Great news! Your device is ready. Please come pick it up." },
  DELIVERED: { label: "Delivered", icon: "🎉", color: "#475569", bg: "#f1f5f9", message: "Your device has been delivered. Thank you for choosing us!" },
  CANCELLED: { label: "Cancelled", icon: "❌", color: "#dc2626", bg: "#fee2e2", message: "This repair order has been cancelled. Please contact us for more information." },
};

export default function TrackPage({ params }: { params: { orderNumber: string } }) {
  const [data, setData] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: string; message: string; senderType: string; createdAt: string }[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    fetch(`/api/track?orderNumber=${params.orderNumber.toLowerCase()}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data?.id) return;
    fetch(`/api/workorders/${data.id}/messages`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setChatMessages(d); });
  }, [data?.id]);

  async function sendChat() {
    if (!newMsg.trim() || !data?.id) return;
    setSendingMsg(true);
    await fetch(`/api/workorders/${data.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: newMsg }),
    });
    setNewMsg("");
    const res = await fetch(`/api/workorders/${data.id}/messages`);
    const msgs = await res.json();
    if (Array.isArray(msgs)) setChatMessages(msgs);
    setSendingMsg(false);
  }

  async function submitRating() {
    if (!selectedStar || !data) return;
    setSubmitting(true);
    try {
      await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: data.orderNumber,
          rating: selectedStar,
          comment: comment.trim() || null,
        }),
      });
      setSubmitted(true);
      setData(prev => prev ? { ...prev, rating: { rating: selectedStar, comment: comment.trim() || null } } : prev);
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  const currentStep = data ? STATUS_STEPS.indexOf(data.status) : -1;
  const config = data ? (STATUS_CONFIG[data.status] ?? STATUS_CONFIG.RECEIVED) : null;
  const progressPct = data?.status === "CANCELLED" ? 0 : Math.max(0, Math.min(100, ((currentStep + 1) / STATUS_STEPS.length) * 100));

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", fontFamily: "'Segoe UI', Arial, sans-serif", padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.05)", borderRadius: 99, padding: "8px 20px", marginBottom: 12 }}>
            {(data?.shop as any)?.logoUrl ? (
              <img src={(data?.shop as any)?.logoUrl} alt="logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: 18 }}>🔧</span>
            )}
            <span style={{ color: "white", fontWeight: 700, fontSize: 18 }}>{data?.shop?.name ?? "FixFlow"}</span>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>Repair Status Tracker</p>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading your repair status...</p>
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 16, padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ color: "#f87171", fontWeight: 600, fontSize: 16, margin: "0 0 8px" }}>Order Not Found</p>
            <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>Please check your order number and try again.</p>
          </div>
        )}

        {data && config && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Ready for pickup banner */}
            {data.status === "DONE" && (
              <div style={{ background: "linear-gradient(135deg, #14532d 0%, #166534 100%)", border: "2px solid #22c55e", borderRadius: 20, padding: "24px 20px", textAlign: "center", boxShadow: "0 0 40px rgba(34,197,94,0.25)" }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
                <p style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: "#bbf7d0", letterSpacing: "-0.02em" }}>
                  Your device is ready for pickup!
                </p>
                <p style={{ margin: "0 0 20px", fontSize: 14, color: "#86efac" }}>
                  Please visit us at your earliest convenience.
                </p>
                {data.shop?.phone && (
                  <a href={`tel:${data.shop.phone}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#22c55e", borderRadius: 99, padding: "12px 28px", color: "white", fontSize: 16, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 16px rgba(34,197,94,0.4)" }}>
                    📞 Call us: {data.shop.phone}
                  </a>
                )}
              </div>
            )}

            {/* Status banner */}
            <div style={{ background: config.bg, borderRadius: 16, padding: 20, border: `1px solid ${config.color}30` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 32 }}>{config.icon}</span>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: config.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Status</p>
                  <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800, color: config.color }}>{config.label}</p>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.5 }}>{config.message}</p>
              {data.status !== "CANCELLED" && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "#64748b" }}>Progress</span>
                    <span style={{ fontSize: 11, color: config.color, fontWeight: 600 }}>{Math.round(progressPct)}%</span>
                  </div>
                  <div style={{ background: "#e2e8f0", borderRadius: 99, height: 6, overflow: "hidden" }}>
                    <div style={{ background: config.color, height: "100%", width: `${progressPct}%`, borderRadius: 99, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Order details */}
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
              <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Order Details</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Order #", value: data.orderNumber.startsWith("wo-") ? data.orderNumber.toUpperCase() : `WO-${new Date(data.receivedAt).getFullYear()}-${data.orderNumber.slice(0, 6).toUpperCase()}` },
                  { label: "Customer", value: data.customerName },
                  { label: "Device", value: `${data.deviceBrand} ${data.deviceModel}` },
                  { label: "Technician", value: data.assignee?.name ?? "Being assigned" },
                  { label: "Received", value: new Date(data.receivedAt).toLocaleDateString() },
                  { label: "Completed", value: data.doneAt ? new Date(data.doneAt).toLocaleDateString() : "In progress" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>{label}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 13, color: "white", fontWeight: 500 }}>{value}</p>
                  </div>
                ))}
              </div>
              {data.faultDescription && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: "#64748b" }}>Issue Reported</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 }}>{data.faultDescription}</p>
                </div>
              )}
            </div>

            {/* Step tracker */}
            {data.status !== "CANCELLED" && (
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
                <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Repair Journey</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {STATUS_STEPS.map((step, i) => {
                    const stepConfig = STATUS_CONFIG[step];
                    const done = i < currentStep;
                    const active = i === currentStep;
                    const pending = i > currentStep;
                    return (
                      <div key={step} style={{ display: "flex", gap: 14, position: "relative" }}>
                        {i < STATUS_STEPS.length - 1 && (
                          <div style={{ position: "absolute", left: 15, top: 30, width: 2, height: 28, background: done ? stepConfig.color : "rgba(255,255,255,0.1)", transition: "background 0.3s" }} />
                        )}
                        <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: done ? stepConfig.color : active ? stepConfig.color : "rgba(255,255,255,0.1)", border: active ? `2px solid ${stepConfig.color}` : "2px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: done ? 14 : 16, boxShadow: active ? `0 0 12px ${stepConfig.color}60` : "none", transition: "all 0.3s" }}>
                          {done ? "✓" : stepConfig.icon}
                        </div>
                        <div style={{ paddingBottom: i < STATUS_STEPS.length - 1 ? 20 : 0, paddingTop: 4 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: active ? 700 : 400, color: pending ? "#475569" : "white" }}>{stepConfig.label}</p>
                          {active && <p style={{ margin: "2px 0 0", fontSize: 11, color: stepConfig.color }}>← Current step</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Timeline */}
            {data.logs && data.logs.length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
                <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Timeline</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {data.logs.map((log, i) => (
                    <div key={i} style={{ display: "flex", gap: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", marginTop: 5, flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: 13, color: "white", fontWeight: 500 }}>{log.action.replace(/_/g, " ")}</p>
                        {log.description && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>{log.description}</p>}
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#475569" }}>{new Date(log.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rating */}
            {data.status === "DELIVERED" && !data.rating && !submitted && (
              <div style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 16, padding: 20 }}>
                <p style={{ fontSize: 22, margin: "0 0 6px", textAlign: "center" }}>⭐</p>
                <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "white", textAlign: "center" }}>How was your experience?</p>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: "#94a3b8", textAlign: "center" }}>Your feedback helps us improve.</p>

                {/* Stars */}
                <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 16 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      onClick={() => setSelectedStar(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      style={{
                        fontSize: 36,
                        cursor: "pointer",
                        transition: "transform 0.1s",
                        transform: (hoveredStar >= star || selectedStar >= star) ? "scale(1.2)" : "scale(1)",
                        filter: (hoveredStar >= star || selectedStar >= star) ? "none" : "grayscale(1) opacity(0.4)",
                      }}
                    >⭐</span>
                  ))}
                </div>

                {selectedStar > 0 && (
                  <>
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ margin: "0 0 6px", fontSize: 12, color: "#94a3b8" }}>Leave a comment (optional)</p>
                      <textarea
                        rows={2}
                        placeholder="Tell us about your experience..."
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "white", fontSize: 13, resize: "none", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    <button
                      onClick={submitRating}
                      disabled={submitting}
                      style={{ width: "100%", padding: "10px 0", background: "#f59e0b", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: submitting ? 0.6 : 1 }}
                    >
                      {submitting ? "Submitting..." : `Submit ${selectedStar} Star Rating`}
                    </button>
                  </>
                )}
                {selectedStar === 0 && (
                  <p style={{ textAlign: "center", fontSize: 12, color: "#64748b", margin: 0 }}>Tap a star to rate</p>
                )}
              </div>
            )}

            {/* Already rated or just submitted */}
            {(data.rating || submitted) && data.status === "DELIVERED" && (
              <div style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.3)", borderRadius: 16, padding: 20, textAlign: "center" }}>
                <p style={{ fontSize: 28, margin: "0 0 6px" }}>{"★".repeat(selectedStar || data.rating?.rating || 0)}</p>
                <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#86efac" }}>Thank you for your feedback!</p>
                {(comment || data.rating?.comment) && (
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>"{comment || data.rating?.comment}"</p>
                )}
              </div>
            )}

            {/* Chat with shop */}
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
              <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Messages</p>
              {chatMessages.length === 0 ? (
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748b" }}>No messages yet. Send us a message below.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14, maxHeight: 240, overflowY: "auto" }}>
                  {chatMessages.map(msg => {
                    const isShop = msg.senderType === "SHOP";
                    return (
                      <div key={msg.id} style={{ display: "flex", justifyContent: isShop ? "flex-start" : "flex-end" }}>
                        <div style={{
                          maxWidth: "80%",
                          background: isShop ? "rgba(37,99,235,0.25)" : "rgba(255,255,255,0.1)",
                          border: isShop ? "1px solid rgba(37,99,235,0.4)" : "1px solid rgba(255,255,255,0.15)",
                          borderRadius: 12,
                          padding: "8px 12px",
                        }}>
                          <p style={{ margin: 0, fontSize: 13, color: "white" }}>{msg.message}</p>
                          <p style={{ margin: "4px 0 0", fontSize: 10, color: "#64748b" }}>
                            {isShop ? "Shop" : "You"} · {new Date(msg.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") sendChat(); }}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    color: "white",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                <button
                  onClick={sendChat}
                  disabled={sendingMsg || !newMsg.trim()}
                  style={{
                    padding: "10px 18px",
                    background: sendingMsg || !newMsg.trim() ? "rgba(37,99,235,0.4)" : "#2563eb",
                    border: "none",
                    borderRadius: 10,
                    color: "white",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: sendingMsg || !newMsg.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {sendingMsg ? "..." : "Send"}
                </button>
              </div>
            </div>

            {/* Contact shop */}
            {data.shop?.phone && (
              <div style={{ textAlign: "center" }}>
                <a href={`tel:${data.shop.phone}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(37,99,235,0.2)", border: "1px solid rgba(37,99,235,0.4)", borderRadius: 99, padding: "10px 24px", color: "#60a5fa", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
                  📞 Call {data.shop.name ?? "us"}: {data.shop.phone}
                </a>
              </div>
            )}

            <p style={{ textAlign: "center", fontSize: 11, color: "#334155", margin: 0 }}>
              Powered by <strong style={{ color: "#475569" }}>FixFlow</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}