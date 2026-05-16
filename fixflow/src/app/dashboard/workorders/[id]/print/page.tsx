"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function PrintWorkOrderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/workorders/${params.id}`)
      .then(r => r.json())
      .then(data => { setOrder(data); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!loading && order) {
      setTimeout(() => window.print(), 500);
    }
  }, [loading, order]);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Preparing print...</div>;
  if (!order) return null;

  const grandTotal = order.subtotal + order.quotationItems - order.discount;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
        body { font-family: Arial, sans-serif; }
      `}</style>

      <div className="no-print p-4 bg-slate-900 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white text-sm">← Back</button>
        <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg">Print / Save PDF</button>
      </div>

      <div className="max-w-2xl mx-auto p-8 bg-white text-black" style={{ minHeight: "100vh" }}>
        {/* Header */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-black">
          <div>
            <h1 className="text-2xl font-bold">FixFlow</h1>
            <p className="text-sm text-gray-500">Repair Work Order</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{formatWO(order.orderNumber, order.createdAt)}</p>
            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 border border-gray-400 rounded">{order.status}</span>
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
                    <td className="py-1 text-right">{p.unitPrice.toFixed(2)}</td>
                    <td className="py-1 text-right font-medium">{p.total.toFixed(2)}</td>
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
                <span>{item.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Quotation */}
        <div className="mt-4 border-t-2 border-black pt-3">
          <div className="flex justify-between text-sm"><span className="text-gray-600">Parts subtotal</span><span>{order.subtotal.toFixed(2)}</span></div>
          {order.quotationItems > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Services subtotal</span><span>{order.quotationItems.toFixed(2)}</span></div>}
          {order.discount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Discount</span><span>-{order.discount.toFixed(2)}</span></div>}
          <div className="flex justify-between font-bold text-base mt-2 border-t border-black pt-2"><span>Total</span><span>{grandTotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm text-green-700"><span>Collected</span><span>{order.collected.toFixed(2)}</span></div>
          {grandTotal - order.collected > 0 && (
            <div className="flex justify-between text-sm text-red-700"><span>Remaining</span><span>{(grandTotal - order.collected).toFixed(2)}</span></div>
          )}
        </div>

        {order.quotationRemarks && (
          <p className="text-xs text-gray-500 mt-3 border-t border-gray-200 pt-2">{order.quotationRemarks}</p>
        )}

        {/* TAT + Footer */}
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

        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>Thank you for choosing our service</p>
        </div>
      </div>
    </>
  );
}
