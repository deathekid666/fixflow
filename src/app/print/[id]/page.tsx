"use client";

import { useEffect, useState } from "react";

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
  creator: { name: string };
  assignee: { name: string } | null;
  parts: { id: string; quantity: number; unitPrice: number; total: number; sparePart: { name: string; partNumber: string } }[];
  lineItems: { id: string; label: string; amount: number }[];
};

function formatWO(raw: string, date: string) {
  return `WO-${new Date(date).getFullYear()}-${raw.slice(0, 6).toUpperCase()}`;
}

export default function PrintPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/workorders/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setOrder(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!loading && order) {
      setTimeout(() => window.print(), 300);
    }
  }, [loading, order]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Arial" }}>
      Preparing receipt...
    </div>
  );

  if (!order) return null;

  const grandTotal = order.subtotal + order.quotationItems - order.discount;

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: white; color: black; }
        .no-print { display: block; }
        @media print {
          .no-print { display: none !important; }
          @page { margin: 15mm; }
        }
        .receipt { max-width: 680px; margin: 0 auto; padding: 30px; background: white; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid black; padding-bottom: 16px; margin-bottom: 20px; }
        .company-name { font-size: 24px; font-weight: bold; }
        .company-sub { font-size: 12px; color: #666; margin-top: 2px; }
        .order-number { font-size: 16px; font-weight: bold; text-align: right; }
        .order-date { font-size: 12px; color: #666; text-align: right; }
        .status-badge { display: inline-block; margin-top: 4px; font-size: 11px; padding: 2px 8px; border: 1px solid #999; border-radius: 4px; }
        .section { margin-bottom: 16px; }
        .section-title { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin-bottom: 6px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .field-label { font-size: 10px; color: #888; }
        .field-value { font-size: 13px; font-weight: 500; margin-top: 1px; }
        .fault-box { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px; font-size: 13px; }
        .fault-meta { display: flex; gap: 20px; margin-top: 8px; font-size: 11px; color: #666; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; font-size: 10px; color: #666; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #ccc; padding: 4px 0; }
        td { padding: 5px 0; border-bottom: 1px solid #f0f0f0; }
        .text-right { text-align: right; }
        .totals { margin-top: 12px; }
        .total-row { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; }
        .total-row.final { font-weight: bold; font-size: 15px; border-top: 2px solid black; padding-top: 6px; margin-top: 4px; }
        .total-row.collected { color: #1a7a1a; }
        .total-row.remaining { color: #c00; }
        .tat-section { margin-top: 16px; padding-top: 12px; border-top: 1px solid #e0e0e0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; color: #666; }
        .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 11px; color: #999; }
        .warranty-badge { display: inline-block; background: #d4edda; color: #155724; font-size: 11px; padding: 2px 8px; border-radius: 4px; margin-top: 4px; }
        .print-btn { position: fixed; top: 20px; right: 20px; background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; }
        .print-btn:hover { background: #1d4ed8; }
        .back-btn { position: fixed; top: 20px; left: 20px; background: #475569; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; }
      `}</style>

      <div className="no-print">
        <button className="back-btn" onClick={() => window.history.back()}>← Back</button>
        <button className="print-btn" onClick={() => window.print()}>🖨️ Print / Save PDF</button>
      </div>

      <div className="receipt">
        {/* Header */}
        <div className="header">
          <div>
            <div className="company-name">FixFlow</div>
            <div className="company-sub">Repair Work Order</div>
          </div>
          <div>
            <div className="order-number">{formatWO(order.orderNumber, order.createdAt)}</div>
            <div className="order-date">{new Date(order.createdAt).toLocaleDateString()}</div>
            <span className="status-badge">{order.status}</span>
          </div>
        </div>

        {/* Customer + Device */}
        <div className="grid-2 section">
          <div>
            <div className="section-title">Customer</div>
            <div className="field-value">{order.customerName}</div>
            <div style={{ fontSize: 13, marginTop: 2 }}>{order.customerPhone}</div>
            {order.customerEmail && <div style={{ fontSize: 12, color: "#666" }}>{order.customerEmail}</div>}
          </div>
          <div>
            <div className="section-title">Device</div>
            <div className="field-value">{order.deviceBrand} {order.deviceModel}</div>
            {order.serialNumber && <div style={{ fontSize: 12, color: "#666" }}>SN: {order.serialNumber}</div>}
            {order.imei && <div style={{ fontSize: 12, color: "#666" }}>IMEI: {order.imei}</div>}
            {order.isUnderWarranty && <span className="warranty-badge">✓ Under Warranty</span>}
          </div>
        </div>

        {/* Fault */}
        <div className="section">
          <div className="section-title">Fault Description</div>
          <div className="fault-box">
            {order.faultDescription}
            <div className="fault-meta">
              <span>Service: {order.serviceType}</span>
              <span>Level: {order.faultLevel}</span>
              {order.repairType && <span>Repair: {order.repairType}</span>}
              {order.appearance && <span>Appearance: {order.appearance}</span>}
            </div>
          </div>
          {order.remarks && <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>Remarks: {order.remarks}</div>}
        </div>

        {/* Parts */}
        {order.parts.length > 0 && (
          <div className="section">
            <div className="section-title">Spare Parts</div>
            <table>
              <thead>
                <tr>
                  <th>Part</th>
                  <th>Part #</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.parts.map(p => (
                  <tr key={p.id}>
                    <td>{p.sparePart.name}</td>
                    <td style={{ color: "#888", fontSize: 11 }}>{p.sparePart.partNumber || "—"}</td>
                    <td className="text-right">{p.quantity}</td>
                    <td className="text-right">{p.unitPrice.toFixed(2)}</td>
                    <td className="text-right" style={{ fontWeight: 500 }}>{p.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Services/Line items */}
        {order.lineItems.length > 0 && (
          <div className="section">
            <div className="section-title">Services</div>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
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
        <div className="totals">
          {order.subtotal > 0 && (
            <div className="total-row"><span>Parts subtotal</span><span>{order.subtotal.toFixed(2)}</span></div>
          )}
          {order.quotationItems > 0 && (
            <div className="total-row"><span>Services subtotal</span><span>{order.quotationItems.toFixed(2)}</span></div>
          )}
          {order.discount > 0 && (
            <div className="total-row"><span>Discount</span><span>-{order.discount.toFixed(2)}</span></div>
          )}
          <div className="total-row final"><span>Total</span><span>{grandTotal.toFixed(2)}</span></div>
          <div className="total-row collected"><span>Collected</span><span>{order.collected.toFixed(2)}</span></div>
          {grandTotal - order.collected > 0 && (
            <div className="total-row remaining"><span>Remaining</span><span>{(grandTotal - order.collected).toFixed(2)}</span></div>
          )}
          {order.quotationRemarks && (
            <div style={{ fontSize: 11, color: "#666", marginTop: 8, borderTop: "1px solid #eee", paddingTop: 8 }}>{order.quotationRemarks}</div>
          )}
        </div>

        {/* TAT + Technician */}
        <div className="tat-section">
          <div>
            <div>Received: {new Date(order.receivedAt).toLocaleDateString()}</div>
            {order.doneAt && <div>Completed: {new Date(order.doneAt).toLocaleDateString()}</div>}
            {order.deliveredAt && <div>Delivered: {new Date(order.deliveredAt).toLocaleDateString()}</div>}
            <div>TAT: {order.tatDays} day{order.tatDays !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div>Technician: {order.assignee?.name ?? "—"}</div>
            <div>Created by: {order.creator.name}</div>
          </div>
        </div>

        <div className="footer">
          <p>Thank you for choosing our service</p>
        </div>
      </div>
    </>
  );
}
