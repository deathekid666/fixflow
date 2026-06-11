"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/currency";

type WorkOrder = {
  id: string; orderNumber: string; deviceBrand: string; deviceModel: string;
  serialNumber: string; imei: string; warrantyStart: string; warrantyEnd: string;
  isUnderWarranty: boolean; customerName: string; customerPhone: string; customerEmail: string;
  faultDescription: string; appearance: string; remarks: string; serviceType: string;
  repairType: string; faultLevel: string; status: string; receivedAt: string;
  doneAt: string | null; deliveredAt: string | null; tatDays: number;
  subtotal: number; quotationItems: number; discount: number; total: number;
  collected: number; quotationRemarks: string | null; createdAt: string;
  creator: { name: string }; assignee: { name: string } | null;
  parts: { id: string; quantity: number; unitPrice: number; total: number; sparePart: { name: string; partNumber: string } }[];
  lineItems: { id: string; label: string; amount: number }[];
  shop?: { name: string; phone: string | null; address: string | null; email: string | null; logoUrl: string | null; currency?: string };
};

function formatWO(raw: string, date: string) {
  // Support both new sequential format and old cuid format
  if (raw.startsWith("wo-")) return raw.toUpperCase();
  return `WO-${new Date(date).getFullYear()}-${raw.slice(0, 6).toUpperCase()}`;
}

export default function PrintWorkOrderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/workorders/${params.id}`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { setOrder(data); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!loading && order) setTimeout(() => window.print(), 500);
  }, [loading, order]);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Preparing print...</div>;
  if (!order) return null;

  const currency = order.shop?.currency ?? "MAD";
  const mad = (n: number) => formatCurrency(n, currency);
  const grandTotal = order.subtotal + order.quotationItems - order.discount;
  const remaining = grandTotal - order.collected;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { margin: 15mm; }
        }
        body { font-family: Arial, sans-serif; }
      `}</style>

      <div className="no-print p-4 bg-slate-100 dark:bg-slate-900 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm">← Back</button>
        <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg">🖨 Print / Save PDF</button>
      </div>

      <div className="max-w-2xl mx-auto p-8 bg-white text-black" style={{ minHeight: "100vh" }}>

        {/* Header with shop branding */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-black">
          <div className="flex items-center gap-3">
            {order.shop?.logoUrl && (
              <img src={order.shop.logoUrl} alt="Shop logo" style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 8 }} />
            )}
            <div>
              <h1 className="text-2xl font-bold">{order.shop?.name ?? "FixFlow"}</h1>
              {order.shop?.address && <p className="text-sm text-gray-500">{order.shop.address}</p>}
              {order.shop?.phone && <p className="text-sm text-gray-500">📞 {order.shop.phone}</p>}
              {order.shop?.email && <p className="text-sm text-gray-500">✉ {order.shop.email}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Repair Work Order</p>
            <p className="text-lg font-bold">{formatWO(order.orderNumber, order.createdAt)}</p>
            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 border border-gray-400 rounded font-medium">{order.status}</span>
          </div>
        </div>

        {/* Customer + Device */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Customer</h2>
            <p className="font-semibold">{order.customerName}</p>
            <p className="text-sm">{order.customerPhone}</p>
            {order.customerEmail && <p className="text-sm">{order.customerEmail}</p>}
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Device</h2>
            <p className="font-semibold">{order.deviceBrand} {order.deviceModel}</p>
            {order.serialNumber && <p className="text-sm">SN: {order.serialNumber}</p>}
            {order.imei && <p className="text-sm">IMEI: {order.imei}</p>}
            {order.isUnderWarranty && <p className="text-sm font-medium text-green-700">✓ Under Warranty</p>}
          </div>
        </div>

        {/* Fault */}
        <div className="mb-6 p-3 border border-gray-200 rounded">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Fault Description</h2>
          <p className="text-sm">{order.faultDescription}</p>
          <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-gray-600">
            <span>Service: {order.serviceType}</span>
            <span>Level: {order.faultLevel}</span>
            {order.repairType && <span>Repair: {order.repairType}</span>}
          </div>
          {order.appearance && <p className="text-xs text-gray-500 mt-1">Appearance: {order.appearance}</p>}
        </div>

        {/* Parts */}
        {order.parts.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Spare Parts</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-1 text-xs">Part</th>
                  <th className="text-left py-1 text-xs">Part #</th>
                  <th className="text-right py-1 text-xs">Qty</th>
                  <th className="text-right py-1 text-xs">Unit Price</th>
                  <th className="text-right py-1 text-xs">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.parts.map(p => (
                  <tr key={p.id} className="border-b border-gray-100">
                    <td className="py-1">{p.sparePart.name}</td>
                    <td className="py-1 text-gray-500">{p.sparePart.partNumber || "—"}</td>
                    <td className="py-1 text-right">{p.quantity}</td>
                    <td className="py-1 text-right">{mad(p.unitPrice)}</td>
                    <td className="py-1 text-right font-medium">{mad(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Line items */}
        {order.lineItems.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Services</h2>
            {order.lineItems.map(item => (
              <div key={item.id} className="flex justify-between text-sm border-b border-gray-100 py-1">
                <span>{item.label}</span>
                <span>{mad(item.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="mt-4 border-t-2 border-black pt-3">
          {order.subtotal > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Parts subtotal</span><span>{mad(order.subtotal)}</span></div>}
          {order.quotationItems > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Services subtotal</span><span>{mad(order.quotationItems)}</span></div>}
          {order.discount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Discount</span><span>-{mad(order.discount)}</span></div>}
          <div className="flex justify-between font-bold text-lg mt-2 border-t border-black pt-2">
            <span>Total</span><span>{mad(grandTotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-green-700 mt-1">
            <span>Collected</span><span>{mad(order.collected)}</span>
          </div>
          {remaining > 0.01 && (
            <div className="flex justify-between text-sm text-red-700 font-medium">
              <span>Remaining</span><span>{mad(remaining)}</span>
            </div>
          )}
          {remaining <= 0.01 && order.collected > 0 && order.collected <= grandTotal + 0.01 && (
            <div className="flex justify-between text-sm text-green-700 font-medium">
              <span>✓ Fully Paid</span><span></span>
            </div>
          )}
          {order.collected > grandTotal + 0.01 && (
            <div className="flex justify-between text-sm text-orange-600 font-medium">
              <span>⚠ Overpaid by {mad(order.collected - grandTotal)}</span><span></span>
            </div>
          )}
        </div>

        {order.quotationRemarks && (
          <p className="text-xs text-gray-500 mt-3 border-t border-gray-200 pt-2">{order.quotationRemarks}</p>
        )}

        {/* TAT */}
        <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div>
            <p>Received: {new Date(order.receivedAt).toLocaleDateString()}</p>
            {order.doneAt && <p>Completed: {new Date(order.doneAt).toLocaleDateString()}</p>}
            {order.deliveredAt && <p>Delivered: {new Date(order.deliveredAt).toLocaleDateString()}</p>}
            <p>TAT: {order.tatDays} day{order.tatDays !== 1 ? "s" : ""}</p>
          </div>
          <div className="text-right">
            <p>Technician: {order.assignee?.name ?? "—"}</p>
            <p>Created by: {order.creator.name}</p>
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-8 grid grid-cols-2 gap-8">
          <div>
            <div className="border-b border-gray-300 mb-1 h-8" />
            <p className="text-xs text-gray-400 text-center">Customer Signature</p>
          </div>
          <div>
            <div className="border-b border-gray-300 mb-1 h-8" />
            <p className="text-xs text-gray-400 text-center">Technician Signature</p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>Thank you for choosing {order.shop?.name ?? "our service"}</p>
          {order.shop?.phone && <p>📞 {order.shop.phone}</p>}
        </div>
      </div>
    </>
  );
}