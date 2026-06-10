"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CheckItem = { id: string; item: string; status: string; note: string | null };
type Part = { id: string; quantity: number; unitPrice: number; total: number; sparePart: { name: string; partNumber: string } };

type WorkOrder = {
  id: string;
  orderNumber: string;
  deviceBrand: string;
  deviceModel: string;
  serialNumber: string;
  imei: string;
  isUnderWarranty: boolean;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  faultDescription: string;
  appearance: string;
  remarks: string;
  repairType: string;
  status: string;
  receivedAt: string;
  doneAt: string | null;
  deliveredAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  creator: { name: string };
  assignee: { name: string } | null;
  shop: { name: string; address?: string; phone?: string; email?: string; logoUrl?: string } | null;
  parts: Part[];
  checklist: CheckItem[];
  tatDays: number;
};

const HEALTH_CHECKS: { label: string; keywords: string[] }[] = [
  { label: "Screen / Display", keywords: ["screen", "display", "lcd", "écran", "touchscreen"] },
  { label: "Battery", keywords: ["battery", "batterie", "autonomie"] },
  { label: "Camera", keywords: ["camera", "cam", "photo", "selfie", "appareil"] },
  { label: "Speakers / Audio", keywords: ["speaker", "sound", "audio", "earpiece", "haut-parleur", "microphone", "mic"] },
  { label: "Charging Port", keywords: ["charging", "charge port", "usb", "connector", "lightning", "port"] },
  { label: "Physical Buttons", keywords: ["button", "power", "volume", "home", "bouton"] },
];

function matchCheck(checklist: CheckItem[], keywords: string[]): CheckItem | null {
  return checklist.find(c =>
    keywords.some(kw => c.item.toLowerCase().includes(kw.toLowerCase()))
  ) ?? null;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
}

type StatusStyle = { icon: string; label: string; bg: string; color: string; border: string };

function statusStyle(status: string | null): StatusStyle {
  if (status === "OK")    return { icon: "✓", label: "OK",          bg: "#dcfce7", color: "#166534", border: "#86efac" };
  if (status === "ISSUE") return { icon: "!", label: "Issue Found",  bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" };
  if (status === "NA")    return { icon: "—", label: "N/A",          bg: "#f1f5f9", color: "#64748b", border: "#cbd5e1" };
  return                         { icon: "?", label: "Not Checked",  bg: "#f8fafc", color: "#94a3b8", border: "#e2e8f0" };
}

export default function HealthReportPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/workorders/${params.id}`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { setOrder(data); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Arial, sans-serif", color: "#64748b" }}>
      Preparing health report…
    </div>
  );
  if (!order) return null;

  const woNumber = order.orderNumber.startsWith("wo-")
    ? `WO-${new Date(order.createdAt).getFullYear()}-${order.orderNumber.slice(3, 9).toUpperCase()}`
    : `WO-${new Date(order.createdAt).getFullYear()}-${order.orderNumber.slice(0, 6).toUpperCase()}`;

  const repairDate = order.doneAt ?? order.deliveredAt ?? order.createdAt;
  const techName = order.assignee?.name ?? order.creator.name;
  const repairDuration = order.startedAt && order.completedAt
    ? formatDuration(new Date(order.completedAt).getTime() - new Date(order.startedAt).getTime())
    : null;

  // Map standard health checks against diagnosis checklist
  const matchedKeys = new Set<string>();
  const healthRows = HEALTH_CHECKS.map(check => {
    const matched = matchCheck(order.checklist, check.keywords);
    if (matched) matchedKeys.add(matched.id);
    return { label: check.label, item: matched };
  });

  // Remaining checklist items not mapped to a standard category
  const extraChecks = order.checklist.filter(c => !matchedKeys.has(c.id));

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f1f5f9; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .no-print { display: flex; align-items: center; gap: 12px; padding: 12px 24px; background: #1e293b; }
        .no-print-title { font-size: 13px; color: #94a3b8; flex: 1; }
        .no-print button { padding: 8px 18px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 500; }
        .btn-back  { background: #475569; color: white; }
        .btn-print { background: #2563eb; color: white; }
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          @page { margin: 14mm; size: A4; }
        }
        .report { max-width: 760px; margin: 24px auto; padding: 40px; background: white; border-radius: 10px; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
        @media print { .report { margin: 0; box-shadow: none; border-radius: 0; } }

        /* Header */
        .report-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 22px; margin-bottom: 24px; border-bottom: 3px solid #0f172a; }
        .shop-logo { width: 56px; height: 56px; object-fit: contain; border-radius: 8px; margin-bottom: 6px; }
        .shop-name { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
        .shop-meta { font-size: 11px; color: #64748b; margin-top: 2px; line-height: 1.6; }
        .report-title-block { text-align: right; }
        .report-title { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; }
        .report-subtitle { font-size: 11px; color: #64748b; margin-top: 3px; }
        .report-wo { font-size: 13px; font-weight: 700; color: #334155; margin-top: 6px; font-family: monospace; }

        /* Sections */
        .section { margin-bottom: 24px; }
        .section-header { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #94a3b8; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
        .card-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 10px; }
        .field { margin-bottom: 7px; }
        .field:last-child { margin-bottom: 0; }
        .field-label { font-size: 10px; color: #94a3b8; }
        .field-value { font-size: 13px; font-weight: 500; color: #0f172a; margin-top: 1px; }
        .badge { display: inline-block; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px; margin-top: 3px; }
        .badge-warranty { background: #dcfce7; color: #166534; }
        .badge-done { background: #d1fae5; color: #065f46; }
        .badge-delivered { background: #e0f2fe; color: #075985; }

        /* Repair summary */
        .repair-summary { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; }
        .fault-text { font-size: 13px; color: #1e293b; line-height: 1.6; margin-bottom: 10px; }
        .repair-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .repair-meta-item .field-label { font-size: 10px; color: #78716c; }
        .repair-meta-item .field-value { font-size: 12px; font-weight: 600; color: #1c1917; }

        /* Parts table */
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { text-align: left; font-size: 9px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 10px; border-bottom: 2px solid #e2e8f0; }
        td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        .text-right { text-align: right; }
        .no-parts { font-size: 12px; color: #94a3b8; font-style: italic; }

        /* Health checklist grid */
        .health-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .health-row { display: flex; align-items: center; justify-content: space-between; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; background: #fafafa; }
        .health-label { font-size: 13px; font-weight: 500; color: #334155; }
        .health-note { font-size: 10px; color: #94a3b8; margin-top: 2px; }
        .status-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; border: 1px solid; flex-shrink: 0; }

        /* Extra checks */
        .extra-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
        .extra-row:last-child { border-bottom: none; }

        /* Certification */
        .cert-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; background: #f8fafc; }
        .cert-text { font-size: 12px; color: #475569; line-height: 1.7; }

        /* Signatures */
        .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px; }
        .sig-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
        .sig-label { font-size: 10px; color: #94a3b8; margin-bottom: 36px; }
        .sig-line { border-top: 1px solid #cbd5e1; padding-top: 4px; font-size: 11px; color: #94a3b8; }

        /* Footer */
        .report-footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8; }
      `}</style>

      {/* Control bar (hidden on print) */}
      <div className="no-print">
        <button className="btn-back" onClick={() => router.back()}>← Back</button>
        <span className="no-print-title">Device Health Report — {woNumber}</span>
        <button className="btn-print" onClick={() => window.print()}>🖨️ Print / Save PDF</button>
      </div>

      <div className="report">
        {/* ── Header ── */}
        <div className="report-header">
          <div>
            {order.shop?.logoUrl && (
              <img src={order.shop.logoUrl} alt="logo" className="shop-logo" />
            )}
            <div className="shop-name">{order.shop?.name ?? "FixFlow"}</div>
            <div className="shop-meta">
              {order.shop?.address && <div>📍 {order.shop.address}</div>}
              {order.shop?.phone && <div>📞 {order.shop.phone}</div>}
              {order.shop?.email && <div>✉ {order.shop.email}</div>}
            </div>
          </div>
          <div className="report-title-block">
            <div className="report-title">Device Health Report</div>
            <div className="report-subtitle">Post-Repair Condition Assessment</div>
            <div className="report-wo">{woNumber}</div>
            <div className="report-subtitle" style={{ marginTop: 4 }}>
              Date: {new Date(repairDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
            </div>
            <span className="badge" style={{
              marginTop: 8,
              display: "inline-block",
              background: order.status === "DELIVERED" ? "#dbeafe" : "#d1fae5",
              color: order.status === "DELIVERED" ? "#1d4ed8" : "#065f46",
              fontSize: 10,
            }}>{order.status}</span>
          </div>
        </div>

        {/* ── Customer + Device ── */}
        <div className="section">
          <div className="two-col">
            <div className="card">
              <div className="card-title">Customer</div>
              <div className="field">
                <div className="field-label">Name</div>
                <div className="field-value">{order.customerName}</div>
              </div>
              <div className="field">
                <div className="field-label">Phone</div>
                <div className="field-value">{order.customerPhone}</div>
              </div>
              {order.customerEmail && (
                <div className="field">
                  <div className="field-label">Email</div>
                  <div className="field-value">{order.customerEmail}</div>
                </div>
              )}
            </div>
            <div className="card">
              <div className="card-title">Device</div>
              <div className="field">
                <div className="field-label">Device</div>
                <div className="field-value">{order.deviceBrand} {order.deviceModel}</div>
              </div>
              {order.serialNumber && (
                <div className="field">
                  <div className="field-label">Serial Number</div>
                  <div className="field-value" style={{ fontFamily: "monospace", fontSize: 12 }}>{order.serialNumber}</div>
                </div>
              )}
              {order.imei && (
                <div className="field">
                  <div className="field-label">IMEI</div>
                  <div className="field-value" style={{ fontFamily: "monospace", fontSize: 12 }}>{order.imei}</div>
                </div>
              )}
              <div className="field">
                <div className="field-label">Appearance</div>
                <div className="field-value">{order.appearance || "Not recorded"}</div>
              </div>
              {order.isUnderWarranty && <span className="badge badge-warranty">✓ Under Warranty</span>}
            </div>
          </div>
        </div>

        {/* ── Repair Summary ── */}
        <div className="section">
          <div className="section-header">Repair Summary</div>
          <div className="repair-summary">
            <div className="field-label" style={{ marginBottom: 4 }}>Reported Fault</div>
            <div className="fault-text">{order.faultDescription}</div>
            <div className="repair-meta">
              <div className="repair-meta-item">
                <div className="field-label">Repair Type</div>
                <div className="field-value">{order.repairType || "—"}</div>
              </div>
              <div className="repair-meta-item">
                <div className="field-label">Technician</div>
                <div className="field-value">{techName}</div>
              </div>
              <div className="repair-meta-item">
                <div className="field-label">Repair Date</div>
                <div className="field-value">{new Date(repairDate).toLocaleDateString("en-GB")}</div>
              </div>
              <div className="repair-meta-item">
                <div className="field-label">Received</div>
                <div className="field-value">{new Date(order.receivedAt).toLocaleDateString("en-GB")}</div>
              </div>
              <div className="repair-meta-item">
                <div className="field-label">TAT</div>
                <div className="field-value">{order.tatDays} day{order.tatDays !== 1 ? "s" : ""}</div>
              </div>
              {repairDuration && (
                <div className="repair-meta-item">
                  <div className="field-label">Repair Duration</div>
                  <div className="field-value">{repairDuration}</div>
                </div>
              )}
            </div>
            {order.remarks && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #fde68a", fontSize: 12, color: "#78716c" }}>
                <strong style={{ color: "#92400e" }}>Remarks:</strong> {order.remarks}
              </div>
            )}
          </div>
        </div>

        {/* ── Parts Replaced ── */}
        <div className="section">
          <div className="section-header">Parts Replaced</div>
          {order.parts.length === 0 ? (
            <p className="no-parts">No spare parts were used in this repair.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Part Name</th>
                  <th>Part Number</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.parts.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.sparePart.name}</td>
                    <td style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: 11 }}>{p.sparePart.partNumber || "—"}</td>
                    <td className="text-right">{p.quantity}</td>
                    <td className="text-right">{p.unitPrice.toFixed(2)} MAD</td>
                    <td className="text-right" style={{ fontWeight: 600 }}>{p.total.toFixed(2)} MAD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Device Condition Assessment ── */}
        <div className="section">
          <div className="section-header">Device Condition Assessment</div>
          <div className="health-grid">
            {healthRows.map(({ label, item }) => {
              const s = statusStyle(item?.status ?? null);
              return (
                <div className="health-row" key={label}>
                  <div>
                    <div className="health-label">{label}</div>
                    {item?.note && <div className="health-note">{item.note}</div>}
                    {!item && <div className="health-note">Not in checklist</div>}
                  </div>
                  <span
                    className="status-badge"
                    style={{ background: s.bg, color: s.color, borderColor: s.border }}
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* Extra checklist items not in standard categories */}
          {extraChecks.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8", marginBottom: 8 }}>
                Additional Checks
              </div>
              {extraChecks.map(check => {
                const s = statusStyle(check.status);
                return (
                  <div className="extra-row" key={check.id}>
                    <span style={{ fontSize: 13, color: "#334155" }}>{check.item}</span>
                    <span
                      className="status-badge"
                      style={{ background: s.bg, color: s.color, borderColor: s.border }}
                    >
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {order.checklist.length === 0 && (
            <p style={{ marginTop: 10, fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>
              No diagnosis checklist was performed for this repair.
            </p>
          )}
        </div>

        {/* ── Certification ── */}
        <div className="section">
          <div className="section-header">Certification</div>
          <div className="cert-box">
            <div className="cert-text">
              This report certifies that the above device has been repaired and tested by{" "}
              <strong>{order.shop?.name ?? "FixFlow"}</strong>. The device condition assessment above
              reflects the state of the device at the time of repair completion on{" "}
              <strong>{new Date(repairDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</strong>.
              {order.isUnderWarranty && " This device is currently under warranty. "}
              {" "}Any issues noted above were pre-existing or unrelated to the repair performed.
            </div>
          </div>
        </div>

        {/* ── Signatures ── */}
        <div className="sig-grid">
          <div className="sig-box">
            <div className="sig-label">Customer Acknowledgement</div>
            <div className="sig-line">Name: {order.customerName}</div>
          </div>
          <div className="sig-box">
            <div className="sig-label">Technician Sign-off</div>
            <div className="sig-line">Name: {techName}</div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="report-footer">
          <span>{order.shop?.name ?? "FixFlow"} · Device Health Report · {woNumber}</span>
          <span>Generated {new Date().toLocaleDateString("en-GB")}</span>
        </div>
      </div>
    </>
  );
}
