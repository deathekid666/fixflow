"use client";

import { useEffect, useRef, useState } from "react";

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
  shop: { name: string; phone: string | null; address: string | null; logoUrl: string | null; certification: string | null } | null;
  logs: { action: string; description: string; createdAt: string }[];
  rating: { rating: number; comment: string | null } | null;
  attachments: { id: string; path: string; filename: string; createdAt: string }[];
};

const STATUS_STEPS = ["RECEIVED", "DIAGNOSING", "REPAIRING", "DONE", "DELIVERED"];

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; message: string }> = {
  RECEIVED:  { label: "Received",         icon: "📥", color: "#2563eb", bg: "#dbeafe", message: "We've received your device and will begin diagnosis shortly." },
  DIAGNOSING:{ label: "Diagnosing",       icon: "🔍", color: "#d97706", bg: "#fef3c7", message: "Our technician is diagnosing your device to identify the issue." },
  REPAIRING: { label: "In Repair",        icon: "🔧", color: "#ea580c", bg: "#ffedd5", message: "Your device is currently being repaired by our technician." },
  DONE:      { label: "Ready for Pickup", icon: "✅", color: "#16a34a", bg: "#dcfce7", message: "Great news! Your device is ready. Please come pick it up." },
  DELIVERED: { label: "Delivered",        icon: "🎉", color: "#475569", bg: "#f1f5f9", message: "Your device has been delivered. Thank you for choosing us!" },
  CANCELLED: { label: "Cancelled",        icon: "❌", color: "#dc2626", bg: "#fee2e2", message: "This repair order has been cancelled. Please contact us for more information." },
};

export default function TrackPage({ params }: { params: { orderNumber: string } }) {
  const [data, setData]               = useState<TrackData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [comment, setComment]         = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ id: string; message: string; senderType: string; createdAt: string }[]>([]);
  const [newMsg, setNewMsg]           = useState("");
  const [sendingMsg, setSendingMsg]   = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef  = useRef(0);

  // Initial load: fetch status then messages in sequence
  useEffect(() => {
    fetch(`/api/track?orderNumber=${params.orderNumber.toLowerCase()}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setData(d);
        return fetch(`/api/workorders/${d.id}/messages`)
          .then(r => r.json())
          .then(msgs => { if (Array.isArray(msgs)) setChatMessages(msgs); });
      })
      .finally(() => setLoading(false));
  }, []);

  // Single combined poll: status + messages every 3 seconds
  useEffect(() => {
    if (!data?.id) return;
    const orderId      = data.id;
    const orderNumber  = params.orderNumber.toLowerCase();
    const id = setInterval(() => {
      Promise.all([
        fetch(`/api/track?orderNumber=${orderNumber}`).then(r => r.json()),
        fetch(`/api/workorders/${orderId}/messages`).then(r => r.json()),
      ]).then(([statusData, msgs]) => {
        if (!statusData.error) setData(statusData);
        if (Array.isArray(msgs)) setChatMessages(msgs);
      }).catch(() => { /* ignore transient poll errors */ });
    }, 3000);
    return () => clearInterval(id);
  }, [data?.id]);

  // Auto-scroll chat only when new messages arrive
  useEffect(() => {
    if (chatMessages.length > prevMsgCountRef.current) {
      const el = chatContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
    prevMsgCountRef.current = chatMessages.length;
  }, [chatMessages]);

  async function sendChat() {
    if (!newMsg.trim() || !data?.id) return;
    setSendingMsg(true);
    try {
      await fetch(`/api/workorders/${data.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMsg }),
      });
      setNewMsg("");
      const res  = await fetch(`/api/workorders/${data.id}/messages`);
      const msgs = await res.json();
      if (Array.isArray(msgs)) setChatMessages(msgs);
    } catch {
      // send failed — input preserved so the customer can retry
    } finally {
      setSendingMsg(false);
    }
  }

  async function submitRating() {
    if (!selectedStar || !data) return;
    setSubmitting(true);
    setRatingError("");
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
    } catch {
      setRatingError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const currentStep  = data ? STATUS_STEPS.indexOf(data.status) : -1;
  const config       = data ? (STATUS_CONFIG[data.status] ?? STATUS_CONFIG.RECEIVED) : null;
  const progressPct  = data?.status === "CANCELLED" ? 0 : Math.max(0, Math.min(100, ((currentStep + 1) / STATUS_STEPS.length) * 100));

  // Deduplicate attachments by id, keep only image paths
  const photoAttachments = data?.attachments
    ? [...new Map(
        data.attachments
          .filter(a => a.path.startsWith("data:image") || a.path.startsWith("https://"))
          .map(a => [a.id, a])
      ).values()]
    : [];

  return (
    <div style={{ minHeight: "100dvh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", fontFamily: "'Segoe UI', Arial, sans-serif", padding: "20px 16px max(40px, env(safe-area-inset-bottom))" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.05)", borderRadius: 99, padding: "8px 20px", marginBottom: 12 }}>
            {data?.shop?.logoUrl ? (
              <img src={data.shop.logoUrl} alt="logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: 18 }}>🔧</span>
            )}
            <span style={{ color: "white", fontWeight: 700, fontSize: 18 }}>{data?.shop?.name ?? "FixFlow"}</span>
          </div>
          {data?.shop?.certification && (
            <div style={{ marginBottom: 8 }}>
              {data.shop.certification === "GOLD" && <span style={{ background: "#fef9c3", color: "#713f12", border: "1px solid #ca8a04", borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>🥇 Gold Certified</span>}
              {data.shop.certification === "SILVER" && <span style={{ background: "#f1f5f9", color: "#374151", border: "1px solid #94a3b8", borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>🥈 Silver Certified</span>}
              {data.shop.certification === "BRONZE" && <span style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #d97706", borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>🥉 Bronze Certified</span>}
            </div>
          )}
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

            {/* Ready for pickup banner — only when status is exactly DONE */}
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
                    const done    = i < currentStep;
                    const active  = i === currentStep;
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

            {/* Repair Photos */}
            {photoAttachments.length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
                <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Repair Photos</p>
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                  {photoAttachments.map(a => (
                    <img
                      key={a.id}
                      src={a.path}
                      alt={a.filename}
                      onClick={() => setLightboxUrl(a.path)}
                      style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 12, flexShrink: 0, cursor: "pointer", border: "2px solid rgba(255,255,255,0.1)", transition: "border-color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "#3b82f6")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                  ))}
                </div>
                <p style={{ margin: "10px 0 0", fontSize: 11, color: "#64748b" }}>Tap a photo to view full size</p>
              </div>
            )}

            {/* Rating */}
            {data.status === "DELIVERED" && !data.rating && !submitted && (
              <div style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 16, padding: 20 }}>
                <p style={{ fontSize: 22, margin: "0 0 6px", textAlign: "center" }}>⭐</p>
                <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "white", textAlign: "center" }}>How was your experience?</p>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: "#94a3b8", textAlign: "center" }}>Your feedback helps us improve.</p>

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
                    {ratingError && (
                      <p style={{ margin: "0 0 10px", fontSize: 12, color: "#f87171", textAlign: "center" }}>{ratingError}</p>
                    )}
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
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
              {/* Chat header */}
              <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(37,99,235,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔧</div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "white" }}>{data.shop?.name ?? "Repair Shop"}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#22c55e" }}>● online</p>
                </div>
              </div>

              {/* Messages area */}
              <div ref={chatContainerRef} style={{ height: 280, overflowY: "auto", padding: "16px 12px", display: "flex", flexDirection: "column", gap: 8, background: "rgba(0,0,0,0.2)" }}>
                {chatMessages.length === 0 && (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <p style={{ fontSize: 13, color: "#475569", textAlign: "center" }}>
                      No messages yet.<br />Send us a message below!
                    </p>
                  </div>
                )}
                {chatMessages.map(msg => {
                  const isCustomer = msg.senderType === "CUSTOMER";
                  const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  return (
                    <div key={msg.id} style={{ display: "flex", justifyContent: isCustomer ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "78%",
                        background: isCustomer ? "#2563eb" : "rgba(255,255,255,0.1)",
                        borderRadius: isCustomer ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        padding: "9px 13px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      }}>
                        {!isCustomer && (
                          <p style={{ margin: "0 0 3px", fontSize: 11, color: "#60a5fa", fontWeight: 600 }}>{data.shop?.name ?? "Shop"}</p>
                        )}
                        <p style={{ margin: 0, fontSize: 14, color: "white", lineHeight: 1.45, wordBreak: "break-word" }}>{msg.message}</p>
                        <p style={{ margin: "4px 0 0", fontSize: 10, color: isCustomer ? "rgba(255,255,255,0.55)" : "#475569", textAlign: "right" }}>
                          {time} {isCustomer && "✓"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div style={{ padding: "10px 12px", paddingBottom: "max(10px, env(safe-area-inset-bottom))", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 8, alignItems: "center", background: "rgba(0,0,0,0.15)" }}>
                <input
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 24,
                    padding: "10px 16px",
                    color: "white",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
                <button
                  onClick={sendChat}
                  disabled={sendingMsg || !newMsg.trim()}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: sendingMsg || !newMsg.trim() ? "rgba(37,99,235,0.4)" : "#2563eb",
                    border: "none",
                    color: "white",
                    fontSize: 18,
                    cursor: sendingMsg || !newMsg.trim() ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 0.15s",
                  }}
                >
                  {sendingMsg ? "·" : "↑"}
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

      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <button
            onClick={() => setLightboxUrl(null)}
            style={{ position: "absolute", top: 16, right: 16, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", color: "white", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ×
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 12, boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}
          />
        </div>
      )}
    </div>
  );
}
