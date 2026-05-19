"use client";

import { useEffect, useState } from "react";

type TrackData = {
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
  logs: { action: string; description: string; createdAt: string }[];
};

const STATUS_STEPS = ["RECEIVED", "DIAGNOSING", "REPAIRING", "DONE", "DELIVERED"];
const STATUS_LABELS: Record<string, string> = {
  RECEIVED: "Received",
  DIAGNOSING: "Diagnosing",
  REPAIRING: "Repairing",
  DONE: "Ready for pickup",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function TrackPage({ params }: { params: { orderNumber: string } }) {
  const [data, setData] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/track?orderNumber=${params.orderNumber.toLowerCase()}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .finally(() => setLoading(false));
  }, []);

  const currentStep = data ? STATUS_STEPS.indexOf(data.status) : -1;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: "bold", color: "#1e293b", margin: 0 }}>FixFlow</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Repair Status Tracker</p>
        </div>

        {loading && <p style={{ textAlign: "center", color: "#64748b" }}>Loading...</p>}

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 20, textAlign: "center" }}>
            <p style={{ color: "#dc2626", fontWeight: 500 }}>Order not found</p>
            <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>Please check your order number and try again.</p>
          </div>
        )}

        {data && (
          <>
            {/* Order info */}
            <div style={{ background: "white", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Order Number</p>
                  <p style={{ fontWeight: "bold", fontFamily: "monospace", color: "#1e293b", margin: "2px 0 0" }}>
                    WO-{new Date(data.receivedAt).getFullYear()}-{data.orderNumber.slice(0, 6).toUpperCase()}
                  </p>
                </div>
                <span style={{
                  background: data.status === "DONE" ? "#dcfce7" : data.status === "DELIVERED" ? "#f1f5f9" : data.status === "CANCELLED" ? "#fee2e2" : "#dbeafe",
                  color: data.status === "DONE" ? "#16a34a" : data.status === "DELIVERED" ? "#475569" : data.status === "CANCELLED" ? "#dc2626" : "#2563eb",
                  padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 500,
                }}>
                  {STATUS_LABELS[data.status] ?? data.status}
                </span>
              </div>
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Device</p>
                  <p style={{ fontSize: 13, color: "#1e293b", margin: "2px 0 0", fontWeight: 500 }}>{data.deviceBrand} {data.deviceModel}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Technician</p>
                  <p style={{ fontSize: 13, color: "#1e293b", margin: "2px 0 0", fontWeight: 500 }}>{data.assignee?.name ?? "Being assigned"}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Received</p>
                  <p style={{ fontSize: 13, color: "#1e293b", margin: "2px 0 0" }}>{new Date(data.receivedAt).toLocaleDateString()}</p>
                </div>
                {data.doneAt && (
                  <div>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Completed</p>
                    <p style={{ fontSize: 13, color: "#1e293b", margin: "2px 0 0" }}>{new Date(data.doneAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress */}
            {data.status !== "CANCELLED" && (
              <div style={{ background: "white", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <p style={{ fontSize: 12, fontWeight: "bold", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 16px" }}>Progress</p>
                <div style={{ position: "relative" }}>
                  {STATUS_STEPS.map((step, i) => (
                    <div key={step} style={{ display: "flex", alignItems: "center", marginBottom: i < STATUS_STEPS.length - 1 ? 16 : 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                        background: i <= currentStep ? "#2563eb" : "#e2e8f0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: i <= currentStep ? "white" : "#94a3b8", fontSize: 12, fontWeight: "bold",
                      }}>
                        {i < currentStep ? "✓" : i + 1}
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div style={{
                          position: "absolute", left: 13, top: `${i * 44 + 28}px`, width: 2, height: 16,
                          background: i < currentStep ? "#2563eb" : "#e2e8f0",
                        }} />
                      )}
                      <div style={{ marginLeft: 12 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: i === currentStep ? 600 : 400, color: i <= currentStep ? "#1e293b" : "#94a3b8" }}>
                          {STATUS_LABELS[step]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            <div style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <p style={{ fontSize: 12, fontWeight: "bold", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>Timeline</p>
              <div>
                {data.logs.map((log, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, fontSize: 13, color: "#1e293b", fontWeight: 500 }}>{log.action.replace(/_/g, " ")}</p>
                      {log.description && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>{log.description}</p>}
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
