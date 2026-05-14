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
  subtotal: number;
  discount: number;
  total: number;
  collected: number;
  createdAt: string;
  creator: { name: string };
  assignee: { name: string } | null;
  parts: {
    id: string;
    quantity: number;
    unitPrice: number;
    total: number;
    sparePart: { name: string; partNumber: string };
  }[];
  logs: {
    id: string;
    action: string;
    description: string;
    createdAt: string;
    user: { name: string };
  }[];
};

const STATUS_OPTIONS = ["RECEIVED", "DIAGNOSING", "REPAIRING", "DONE", "DELIVERED", "CANCELLED"];
const STATUS_COLORS: Record<string, string> = {
  RECEIVED: "bg-blue-500/20 text-blue-400",
  DIAGNOSING: "bg-yellow-500/20 text-yellow-400",
  REPAIRING: "bg-orange-500/20 text-orange-400",
  DONE: "bg-green-500/20 text-green-400",
  DELIVERED: "bg-slate-500/20 text-slate-400",
  CANCELLED: "bg-red-500/20 text-red-400",
};

export default function WorkOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch(`/api/workorders/${params.id}`);
    if (!res.ok) { router.push("/dashboard"); return; }
    setOrder(await res.json());
    setLoading(false);
  }

  async function changeStatus(status: string) {
    setUpdatingStatus(true);
    await fetch(`/api/workorders/${params.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
    setUpdatingStatus(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Loading...</div>
  );

  if (!order) return null;

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white text-sm">← Back</button>
          <span className="font-mono text-sm text-slate-400">{order.orderNumber.slice(0, 12).toUpperCase()}</span>
          {order.isUnderWarranty && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Under Warranty</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            className={`text-xs px-3 py-1.5 rounded-full font-medium border-0 focus:outline-none cursor-pointer ${STATUS_COLORS[order.status]}`}
            value={order.status}
            onChange={(e) => changeStatus(e.target.value)}
            disabled={updatingStatus}
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left column */}
        <div className="col-span-2 space-y-4">
          {/* Device */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Device Information</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Brand" value={order.deviceBrand} />
              <Info label="Model" value={order.deviceModel} />
              <Info label="Serial Number" value={order.serialNumber || "—"} />
              <Info label="IMEI" value={order.imei || "—"} />
              <Info label="Warranty Start" value={order.warrantyStart ? new Date(order.warrantyStart).toLocaleDateString() : "—"} />
              <Info label="Warranty End" value={order.warrantyEnd ? new Date(order.warrantyEnd).toLocaleDateString() : "—"} />
            </div>
          </section>

          {/* Customer */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Customer Information</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Name" value={order.customerName} />
              <Info label="Phone" value={order.customerPhone} />
              <Info label="Email" value={order.customerEmail || "—"} />
            </div>
          </section>

          {/* Fault */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Fault & Service</h2>
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <Info label="Service Type" value={order.serviceType} />
              <Info label="Repair Type" value={order.repairType || "—"} />
              <Info label="Fault Level" value={order.faultLevel} />
              <Info label="Appearance" value={order.appearance || "—"} />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Fault Description</p>
              <p className="text-sm text-white bg-slate-800 rounded-lg p-3">{order.faultDescription}</p>
            </div>
            {order.remarks && (
              <div className="space-y-2 mt-3">
                <p className="text-xs text-slate-500">Remarks</p>
                <p className="text-sm text-slate-300 bg-slate-800 rounded-lg p-3">{order.remarks}</p>
              </div>
            )}
          </section>

          {/* Parts */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Spare Parts Used</h2>
            {order.parts.length === 0 ? (
              <p className="text-sm text-slate-500">No parts added yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left pb-2 text-xs text-slate-500">Part</th>
                    <th className="text-left pb-2 text-xs text-slate-500">Part #</th>
                    <th className="text-right pb-2 text-xs text-slate-500">Qty</th>
                    <th className="text-right pb-2 text-xs text-slate-500">Unit Price</th>
                    <th className="text-right pb-2 text-xs text-slate-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.parts.map((p) => (
                    <tr key={p.id} className="border-b border-slate-800/50">
                      <td className="py-2 text-white">{p.sparePart.name}</td>
                      <td className="py-2 text-slate-400 font-mono text-xs">{p.sparePart.partNumber || "—"}</td>
                      <td className="py-2 text-right text-slate-300">{p.quantity}</td>
                      <td className="py-2 text-right text-slate-300">{p.unitPrice.toFixed(2)}</td>
                      <td className="py-2 text-right text-white font-medium">{p.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quotation */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Quotation</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Discount</span>
                <span>-{order.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white font-semibold border-t border-slate-800 pt-2 mt-2">
                <span>Total</span>
                <span>{order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-400">
                <span>Collected</span>
                <span>{order.collected.toFixed(2)}</span>
              </div>
              {order.total - order.collected > 0 && (
                <div className="flex justify-between text-red-400 text-xs">
                  <span>Remaining</span>
                  <span>{(order.total - order.collected).toFixed(2)}</span>
                </div>
              )}
            </div>
          </section>

          {/* Operation Log */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Operation Log</h2>
            <div className="space-y-3">
              {order.logs.map((log) => (
                <div key={log.id} className="text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 font-medium">{log.action}</span>
                    <span className="text-slate-600">{new Date(log.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-400 mt-0.5">{log.description}</p>
                  <p className="text-slate-600">by {log.user.name}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Meta */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs space-y-2">
            <Info label="Created by" value={order.creator.name} />
            <Info label="Assigned to" value={order.assignee?.name ?? "Unassigned"} />
            <Info label="Created" value={new Date(order.createdAt).toLocaleString()} />
          </section>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-white mt-0.5">{value}</p>
    </div>
  );
}
