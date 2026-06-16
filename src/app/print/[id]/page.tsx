"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/currency";

type WorkOrder = {
  id: string;
  orderNumber: string;
  deviceBrand: string;
  deviceModel: string;
  serialNumber: string;
  imei: string;
  warrantyStart: string;
  warrantyEnd: string;
  isUnderWarranty: boolean;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  faultDescription: string;
  appearance: string;
  remarks: string;
  serviceType: string;
  repairType: string;
  faultLevel: string;
  status: string;
  receivedAt: string;
  doneAt: string | null;
  deliveredAt: string | null;
  tatDays: number;
  subtotal: number;
  quotationItems: number;
  discount: number;
  total: number;
  collected: number;
  quotationRemarks: string | null;
  createdAt: string;
  taxRate: number;
  creator: { name: string };
  assignee: { name: string } | null;
  shop: { name: string; address?: string; phone?: string; currency?: string; certification?: string | null } | null;
  parts: { id: string; quantity: number; unitPrice: number; total: number; sparePart: { name: string; partNumber: string } }[];
  lineItems: { id: string; label: string; amount: number }[];
};

export default function PrintPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");

  function loadOrder() {
    setLoading(true);
    setError("");
    fetch(`/api/print/${params.id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setOrder(data); setLoading(false); })
      .catch(() => { setError("Could not load this receipt. Please try again."); setLoading(false); });
  }

  useEffect(() => {
    setOrigin(window.location.origin);
    loadOrder();
  }, []);

  useEffect(() => {
    if (!loading && order) setTimeout(() => window.print(), 300);
  }, [loading, order]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Arial", color: "#475569" }}>
      Preparing receipt...
    </div>
  );
  if (error) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Arial", gap: 16, padding: 20, textAlign: "center" }}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <p style={{ color: "#dc2626", fontWeight: 600, fontSize: 16, margin: 0 }}>Something went wrong</p>
      <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{error}</p>
      <button onClick={loadOrder} style={{ background: "#2563eb", color: "white", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
        Try again
      </button>
    </div>
  );
  if (!order) return null;

  const currency = order.shop?.currency ?? "MAD";
  const mad = (n: number) => formatCurrency(n, currency);
  const grandTotal = order.subtotal + order.quotationItems - order.discount;
  const taxAmount = grandTotal * (order.taxRate ?? 0) / 100;
  const totalWithTax = grandTotal + taxAmount;
  const remaining = totalWithTax - order.collected;
  const woNumber = `WO-${new Date(order.createdAt).getFullYear()}-${order.orderNumber.slice(0, 6).toUpperCase()}`;
  const trackUrl = `${origin}/track/${order.orderNumber.slice(0, 6)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(trackUrl)}`;

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f1f5f9; color: black; }
        .no-print { display: flex; gap: 12px; padding: 16px 24px; background: #1e293b; }
        .no-print button { padding: 8px 18px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 500; }
        .btn-back { background: #475569; color: white; }
        .btn-print { background: #2563eb; color: white; }
        @media print {
          .no-print { display: none !important; }
          .mobile-print-bar { display: none !important; }
          body { background: white; }
          @page { margin: 12mm; size: A4; }
        }
        .receipt { max-width: 720px; margin: 24px auto; padding: 36px; background: white; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        @media print { .receipt { margin: 0; box-shadow: none; border-radius: 0; padding: 0; } }
        /* Sticky mobile print button — hidden on desktop and when printing */
        .mobile-print-bar { display: none; }
        @media screen and (max-width: 767px) {
          .receipt { margin: 12px; padding: 18px; max-width: 100%; padding-bottom: 88px; }
          .two-col, .bottom-grid { grid-template-columns: 1fr; gap: 12px; }
          .footer-row { flex-direction: column; align-items: stretch; gap: 16px; }
          .qr-block { align-self: center; }
          .mobile-print-bar {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
            padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); background: #1e293b;
            box-shadow: 0 -2px 12px rgba(0,0,0,0.3);
          }
          .mobile-print-bar button {
            flex: 1; padding: 12px; border-radius: 10px; border: none; cursor: pointer;
            font-size: 15px; font-weight: 600; background: #2563eb; color: white;
          }
        }
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; margin-bottom: 20px; border-bottom: 3px solid #1e293b; }
        .shop-name { font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
        .shop-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
        .shop-contact { font-size: 11px; color: #64748b; margin-top: 4px; }
        .wo-block { text-align: right; }
        .wo-number { font-size: 18px; font-weight: 700; color: #0f172a; }
        .wo-date { font-size: 12px; color: #64748b; margin-top: 2px; }
        .status-pill { display: inline-block; margin-top: 6px; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
        .card-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 8px; }
        .field { margin-bottom: 6px; }
        .field-label { font-size: 10px; color: #94a3b8; }
        .field-value { font-size: 13px; font-weight: 500; color: #0f172a; margin-top: 1px; }
        .badge-warranty { display: inline-block; background: #dcfce7; color: #166534; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px; margin-top: 4px; }
        .fault-card { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; margin-bottom: 20px; }
        .fault-text { font-size: 13px; color: #1e293b; line-height: 1.5; }
        .fault-meta { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 10px; }
        .fault-meta span { font-size: 11px; color: #78716c; background: #fef3c7; padding: 2px 8px; border-radius: 4px; }
        .remarks-text { font-size: 12px; color: #64748b; margin-top: 8px; padding-top: 8px; border-top: 1px solid #fde68a; }
        .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
        th { text-align: left; font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; padding: 6px 8px; border-bottom: 2px solid #e2e8f0; }
        td { padding: 7px 8px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
        .text-right { text-align: right; }
        .totals-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px; max-width: 320px; margin-left: auto; }
        .total-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; padding: 4px 0; color: #475569; }
        .total-row.item-row { color: #374151; }
        .total-row.item-row span:first-child { padding-left: 8px; }
        .total-row.subtotal-row { color: #64748b; font-size: 12px; border-top: 1px dashed #e2e8f0; padding-top: 6px; margin-top: 2px; }
        .total-row.discount { color: #dc2626; }
        .total-row.grand { font-weight: 800; font-size: 16px; color: #0f172a; border-top: 2px solid #1e293b; padding-top: 10px; margin-top: 6px; }
        .total-row.collected { color: #16a34a; font-weight: 600; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 4px; }
        .total-row.remaining { color: #dc2626; font-weight: 600; }
        .totals-section-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; padding: 8px 0 2px; margin-top: 4px; }
        .bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        .sig-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
        .sig-label { font-size: 10px; color: #94a3b8; margin-bottom: 40px; }
        .sig-line { border-top: 1px solid #cbd5e1; padding-top: 4px; font-size: 11px; color: #94a3b8; }
        .footer-row { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 16px; border-top: 1px solid #e2e8f0; gap: 20px; }
        .footer-text { font-size: 11px; color: #94a3b8; line-height: 1.8; flex: 1; }
        .footer-text strong { color: #475569; }
        .qr-block { text-align: center; flex-shrink: 0; }
        .qr-label { font-size: 9px; color: #94a3b8; margin-top: 4px; }
      `}</style>

      <div className="no-print">
        <button className="btn-back" onClick={() => window.history.back()}>← Back</button>
        <button className="btn-print" onClick={() => window.print()}>🖨️ Print / Save PDF</button>
      </div>

      <div className="receipt">
        {/* Header */}
        <div className="header">
          <div>
            <div className="shop-name">{order.shop?.name ?? "FixFlow"}</div>
            <div className="shop-sub" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              Repair Work Order Receipt
              {order.shop?.certification === "GOLD" && <span style={{ background: "#fef9c3", color: "#713f12", border: "1px solid #ca8a04", borderRadius: 99, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>🥇 Gold Certified</span>}
              {order.shop?.certification === "SILVER" && <span style={{ background: "#f1f5f9", color: "#374151", border: "1px solid #94a3b8", borderRadius: 99, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>🥈 Silver Certified</span>}
              {order.shop?.certification === "BRONZE" && <span style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #d97706", borderRadius: 99, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>🥉 Bronze Certified</span>}
            </div>
            {order.shop?.address && <div className="shop-contact">📍 {order.shop.address}</div>}
            {order.shop?.phone && <div className="shop-contact">📞 {order.shop.phone}</div>}
          </div>
          <div className="wo-block">
            <div className="wo-number">{woNumber}</div>
            <div className="wo-date">Date: {new Date(order.createdAt).toLocaleDateString()}</div>
            <div className="wo-date">Received: {new Date(order.receivedAt).toLocaleDateString()}</div>
            <span className="status-pill">{order.status}</span>
          </div>
        </div>

        {/* Customer + Device */}
        <div className="two-col">
          <div className="card">
            <div className="card-title">Customer Information</div>
            <div className="field"><div className="field-label">Name</div><div className="field-value">{order.customerName}</div></div>
            <div className="field"><div className="field-label">Phone</div><div className="field-value">{order.customerPhone}</div></div>
            {order.customerEmail && <div className="field"><div className="field-label">Email</div><div className="field-value">{order.customerEmail}</div></div>}
          </div>
          <div className="card">
            <div className="card-title">Device Information</div>
            <div className="field"><div className="field-label">Device</div><div className="field-value">{order.deviceBrand} {order.deviceModel}</div></div>
            {order.serialNumber && <div className="field"><div className="field-label">Serial Number</div><div className="field-value">{order.serialNumber}</div></div>}
            {order.imei && <div className="field"><div className="field-label">IMEI</div><div className="field-value">{order.imei}</div></div>}
            {order.isUnderWarranty && <span className="badge-warranty">✓ Under Warranty</span>}
          </div>
        </div>

        {/* Fault */}
        <div className="fault-card">
          <div className="card-title">Fault Description</div>
          <div className="fault-text">{order.faultDescription}</div>
          <div className="fault-meta">
            <span>Service: {order.serviceType}</span>
            <span>Level: {order.faultLevel}</span>
            {order.repairType && <span>Repair: {order.repairType}</span>}
            {order.appearance && <span>Appearance: {order.appearance}</span>}
          </div>
          {order.remarks && <div className="remarks-text">Remarks: {order.remarks}</div>}
        </div>

        {/* Parts */}
        {order.parts.length > 0 && (
          <div>
            <div className="section-title">Spare Parts Used</div>
            <table>
              <thead><tr>
                <th>Part Name</th><th>Part #</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Total</th>
              </tr></thead>
              <tbody>
                {order.parts.map(p => (
                  <tr key={p.id}>
                    <td>{p.sparePart.name}</td>
                    <td style={{ color: "#94a3b8", fontSize: 11 }}>{p.sparePart.partNumber || "—"}</td>
                    <td className="text-right">{p.quantity}</td>
                    <td className="text-right">{p.unitPrice.toFixed(2)}</td>
                    <td className="text-right" style={{ fontWeight: 600 }}>{p.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Services */}
        {order.lineItems.length > 0 && (
          <div>
            <div className="section-title">Services</div>
            <table>
              <thead><tr><th>Description</th><th className="text-right">Amount</th></tr></thead>
              <tbody>
                {order.lineItems.map(item => (
                  <tr key={item.id}>
                    <td>{item.label}</td>
                    <td className="text-right">{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="totals-block">
          {order.subtotal > 0 && (
            <div className="total-row subtotal-row">
              <span>Parts subtotal</span><span>{mad(order.subtotal)}</span>
            </div>
          )}
          {order.lineItems.length > 0 && (
            <>
              <div className="totals-section-label">Services</div>
              {order.lineItems.map(item => (
                <div key={item.id} className="total-row item-row">
                  <span>{item.label}</span>
                  <span>{mad(item.amount)}</span>
                </div>
              ))}
              {order.quotationItems > 0 && (
                <div className="total-row subtotal-row">
                  <span>Services subtotal</span><span>{mad(order.quotationItems)}</span>
                </div>
              )}
            </>
          )}
          {order.discount > 0 && (
            <div className="total-row discount">
              <span>Discount</span><span>− {mad(order.discount)}</span>
            </div>
          )}
          {taxAmount > 0 ? (
            <>
              <div className="total-row subtotal-row"><span>Subtotal</span><span>{mad(grandTotal)}</span></div>
              <div className="total-row subtotal-row"><span>{order.taxRate}% tax</span><span>{mad(taxAmount)}</span></div>
              <div className="total-row grand"><span>Total incl. tax</span><span>{mad(totalWithTax)}</span></div>
            </>
          ) : (
            <div className="total-row grand"><span>Total</span><span>{mad(grandTotal)}</span></div>
          )}
          <div className="total-row collected"><span>Collected</span><span>{mad(order.collected)}</span></div>
          {remaining > 0 && <div className="total-row remaining"><span>Remaining</span><span>{mad(remaining)}</span></div>}
          {order.quotationRemarks && (
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 10, paddingTop: 10, borderTop: "1px solid #e2e8f0", lineHeight: 1.5 }}>
              {order.quotationRemarks}
            </div>
          )}
        </div>

        {/* Signatures */}
        <div className="bottom-grid">
          <div className="sig-box">
            <div className="sig-label">Customer Signature</div>
            <div className="sig-line">Name: {order.customerName}</div>
          </div>
          <div className="sig-box">
            <div className="sig-label">Technician Signature</div>
            <div className="sig-line">Name: {order.assignee?.name ?? order.creator.name}</div>
          </div>
        </div>

        {/* TAT info */}
        <div style={{ fontSize: 12, color: "#64748b", display: "flex", justifyContent: "space-between", marginBottom: 20, padding: "12px 0", borderTop: "1px solid #e2e8f0" }}>
          <div>
            <div>Received: {new Date(order.receivedAt).toLocaleDateString()}</div>
            {order.doneAt && <div>Completed: {new Date(order.doneAt).toLocaleDateString()}</div>}
            {order.deliveredAt && <div>Delivered: {new Date(order.deliveredAt).toLocaleDateString()}</div>}
            <div>TAT: {order.tatDays} day{order.tatDays !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div>Technician: {order.assignee?.name ?? "—"}</div>
            <div>Created by: {order.creator.name}</div>
            <div>Order #: {woNumber}</div>
          </div>
        </div>

        {/* Footer + QR */}
        <div className="footer-row">
          <div className="footer-text">
            <p><strong>Thank you for choosing {order.shop?.name ?? "FixFlow"}!</strong></p>
            <p>This receipt is proof of repair service. Please keep it for warranty claims.</p>
            {order.shop?.phone && <p>Contact: {order.shop.phone}</p>}
            {order.shop?.address && <p>{order.shop.address}</p>}
          </div>
          <div className="qr-block">
            <img src={qrUrl} alt="Track QR Code" style={{ width: 100, height: 100, display: "block" }} />
            <div className="qr-label">Scan to track repair</div>
          </div>
        </div>
      </div>

      {/* Sticky print button for mobile */}
      <div className="mobile-print-bar">
        <button onClick={() => window.print()}>🖨️ Print / Save PDF</button>
      </div>
    </>
  );
}