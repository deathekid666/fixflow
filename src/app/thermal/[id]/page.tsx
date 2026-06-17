"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatCurrency } from "@/lib/currency";

type WorkOrder = {
  id: string; orderNumber: string; deviceBrand: string; deviceModel: string;
  serialNumber: string; imei: string;
  customerName: string; customerPhone: string;
  faultDescription: string; repairType: string; status: string;
  receivedAt: string; doneAt: string | null; deliveredAt: string | null; createdAt: string;
  subtotal: number; quotationItems: number; discount: number; total: number;
  collected: number; taxRate: number; quotationRemarks: string | null;
  creator: { name: string }; assignee: { name: string } | null;
  parts: { id: string; quantity: number; unitPrice: number; total: number; sparePart: { name: string; partNumber: string } }[];
  lineItems: { id: string; label: string; amount: number }[];
  payments: { amount: number; method: string; createdAt: string }[];
  shop?: { name: string; phone: string | null; address: string | null; email: string | null; currency?: string };
};

function formatWO(raw: string, date: string) {
  if (raw.startsWith("wo-")) return raw.toUpperCase();
  return `WO-${new Date(date).getFullYear()}-${raw.slice(0, 6).toUpperCase()}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function centerText(text: string, width: number) {
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(pad) + text;
}

function lineRow(label: string, value: string, width: number) {
  const space = width - label.length - value.length;
  return label + " ".repeat(Math.max(1, space)) + value;
}

export default function ThermalReceiptPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const widthParam = searchParams.get("width") ?? "80";
  const mmWidth = widthParam === "58" ? 58 : 80;
  // Character width: 80mm ≈ 42 chars, 58mm ≈ 32 chars
  const charWidth = mmWidth === 58 ? 32 : 42;
  const sep = "-".repeat(charWidth);
  const doubleSep = "=".repeat(charWidth);

  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/print/${params.id}`)
      .then(r => r.json())
      .then(d => { setOrder(d); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!loading && order) setTimeout(() => window.print(), 400);
  }, [loading, order]);

  if (loading) return (
    <div style={{ fontFamily: "monospace", padding: 16, fontSize: 12 }}>Preparing receipt…</div>
  );
  if (!order) return null;

  const currency = order.shop?.currency ?? "MAD";
  const mad = (n: number) => formatCurrency(n, currency);
  const grandTotal = order.subtotal + order.quotationItems - order.discount;
  const taxAmount = grandTotal * (order.taxRate ?? 0) / 100;
  const totalWithTax = grandTotal + taxAmount;
  const remaining = totalWithTax - order.collected;
  const lastPayment = order.payments?.[0] ?? null;

  const mmPx = mmWidth === 58 ? "58mm" : "80mm";
  const fontSize = mmWidth === 58 ? "9px" : "11px";
  const margin = mmWidth === 58 ? "1mm 1.5mm" : "2mm 3mm";

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: white; }
        body {
          font-family: "Courier New", Courier, monospace;
          font-size: ${fontSize};
          line-height: 1.35;
          width: ${mmPx};
          color: #000;
        }
        .receipt { width: ${mmPx}; padding: 2mm 0; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .large { font-size: ${mmWidth === 58 ? "11px" : "13px"}; }
        .small { font-size: ${mmWidth === 58 ? "8px" : "9px"}; }
        pre { font-family: inherit; font-size: inherit; white-space: pre-wrap; word-break: break-all; }
        @media print {
          html, body { width: ${mmPx}; }
          @page {
            size: ${mmPx} auto;
            margin: ${margin};
          }
          .no-print { display: none !important; }
        }
        @media screen {
          body { max-width: ${mmPx}; margin: 0 auto; padding: 8px; }
        }
      `}</style>

      <div className="no-print" style={{ background: "#1e293b", color: "#94a3b8", padding: "8px 12px", fontSize: 12, display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={() => window.close()} style={{ color: "#94a3b8", background: "none", border: "none", cursor: "pointer", fontSize: 12 }}>← Close</button>
        <button onClick={() => window.print()} style={{ background: "#2563eb", color: "white", border: "none", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🖨 Print {mmWidth}mm Receipt</button>
        <span style={{ fontSize: 11, opacity: 0.6 }}>{mmWidth}mm · {charWidth} chars wide</span>
      </div>

      <div className="receipt">
        <pre>
{doubleSep}
{centerText(order.shop?.name?.toUpperCase() ?? "FIXFLOW", charWidth)}
{order.shop?.address ? centerText(order.shop.address, charWidth) : ""}
{order.shop?.phone ? centerText(order.shop.phone, charWidth) : ""}
{doubleSep}
{centerText("REPAIR RECEIPT", charWidth)}
{doubleSep}
{lineRow("Order:", formatWO(order.orderNumber, order.createdAt), charWidth)}
{lineRow("Date:", `${fmtDate(order.createdAt)} ${fmtTime(order.createdAt)}`, charWidth)}
{lineRow("Status:", order.status, charWidth)}
{sep}
{centerText("CUSTOMER", charWidth)}
{sep}
{lineRow("Name:", order.customerName, charWidth)}
{lineRow("Phone:", order.customerPhone, charWidth)}
{sep}
{centerText("DEVICE", charWidth)}
{sep}
{lineRow("Device:", `${order.deviceBrand} ${order.deviceModel}`, charWidth)}
{order.serialNumber ? lineRow("SN:", order.serialNumber, charWidth) : ""}
{order.imei ? lineRow("IMEI:", order.imei, charWidth) : ""}
{order.repairType ? lineRow("Repair:", order.repairType, charWidth) : ""}
{sep}
{centerText("ITEMS", charWidth)}
{sep}
{order.lineItems.length === 0 && order.parts.length === 0 ? centerText("(no items)", charWidth) : ""}
{order.lineItems.map(item => lineRow(
  item.label.length > charWidth - 10 ? item.label.slice(0, charWidth - 11) + "…" : item.label,
  mad(item.amount),
  charWidth
)).join("\n")}
{order.parts.map(p => {
  const name = p.sparePart.name.length > charWidth - 12 ? p.sparePart.name.slice(0, charWidth - 13) + "…" : p.sparePart.name;
  const label = `${name} x${p.quantity}`;
  return lineRow(label, mad(p.total), charWidth);
}).join("\n")}
{sep}
{order.discount > 0 ? lineRow("Discount:", `-${mad(order.discount)}`, charWidth) : ""}
{taxAmount > 0 ? lineRow("Subtotal:", mad(grandTotal), charWidth) : ""}
{taxAmount > 0 ? lineRow(`Tax ${order.taxRate}%:`, mad(taxAmount), charWidth) : ""}
{doubleSep}
{lineRow("TOTAL:", mad(totalWithTax), charWidth)}
{doubleSep}
{lineRow("Collected:", mad(order.collected), charWidth)}
{remaining > 0.01 ? lineRow("Remaining:", mad(remaining), charWidth) : lineRow("Status:", "PAID", charWidth)}
{order.collected > totalWithTax + 0.01 ? lineRow("Change:", mad(order.collected - totalWithTax), charWidth) : ""}
{lastPayment ? lineRow("Payment:", lastPayment.method, charWidth) : ""}
{doubleSep}
{centerText("Thank you for your trust!", charWidth)}
{order.shop?.name ? centerText(order.shop.name, charWidth) : ""}
{order.shop?.phone ? centerText(order.shop.phone, charWidth) : ""}
{doubleSep}
        </pre>
      </div>
    </>
  );
}
