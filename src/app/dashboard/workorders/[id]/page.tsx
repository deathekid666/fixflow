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
  assignee: { id: string; name: string } | null;
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

type Engineer = { id: string; name: string };
type SparePart = { id: string; name: string; partNumber: string; unitPrice: number; stock: number };

const STATUS_OPTIONS = ["RECEIVED", "DIAGNOSING", "REPAIRING", "DONE", "DELIVERED", "CANCELLED"];
const STATUS_COLORS: Record<string, string> = {
  RECEIVED: "bg-blue-500/20 text-blue-400",
  DIAGNOSING: "bg-yellow-500/20 text-yellow-400",
  REPAIRING: "bg-orange-500/20 text-orange-400",
  DONE: "bg-green-500/20 text-green-400",
  DELIVERED: "bg-slate-500/20 text-slate-400",
  CANCELLED: "bg-red-500/20 text-red-400",
};

function formatOrderNumber(raw: string, createdAt: string) {
  const year = new Date(createdAt).getFullYear();
  return `WO-${year}-${raw.slice(0, 6).toUpperCase()}`;
}

export default function WorkOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);

  // Part form
  const [showPartForm, setShowPartForm] = useState(false);
  const [selectedPart, setSelectedPart] = useState("");
  const [partQty, setPartQty] = useState("1");
  const [addingPart, setAddingPart] = useState(false);

  // Quotation edit
  const [editingQuotation, setEditingQuotation] = useState(false);
  const [discount, setDiscount] = useState("0");
  const [collected, setCollected] = useState("0");
  const [savingQuotation, setSavingQuotation] = useState(false);

  useEffect(() => {
    load();
    fetch("/api/users").then(r => r.json()).then(setEngineers);
    fetch("/api/spareparts").then(r => r.json()).then(setSpareParts);
  }, []);

  async function load() {
    const res = await fetch(`/api/workorders/${params.id}`);
    if (!res.ok) { router.push("/dashboard"); return; }
    const data = await res.json();
    setOrder(data);
    setDiscount(data.discount.toString());
    setCollected(data.collected.toString());
    setLoading(false);
  }

  async function changeStatus(status: string) {
    await fetch(`/api/workorders/${params.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function assignEngineer(assignedTo: string) {
    await fetch(`/api/workorders/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedTo: assignedTo || null }),
    });
    await load();
  }

  async function addPart() {
    if (!selectedPart || !partQty) return;
    setAddingPart(true);
    await fetch(`/api/workorders/${params.id}/parts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sparePartId: selectedPart, quantity: parseInt(partQty) }),
    });
    setSelectedPart("");
    setPartQty("1");
    setShowPartForm(false);
    await load();
    fetch("/api/spareparts").then(r => r.json()).then(setSpareParts);
    setAddingPart(false);
  }

  async function saveQuotation() {
    setSavingQuotation(true);
    const d = parseFloat(discount) || 0;
    const c = parseFloat(collected) || 0;
    await fetch(`/api/workorders/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        discount: d,
        collected: c,
        total: (order?.subtotal ?? 0) - d,
      }),
    });
    setEditingQuotation(false);
    await load();
    setSavingQuotation(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Loading...</div>
  );

  if (!order) return null;

  const selectedPartData = spareParts.find(p => p.id === selectedPart);

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white text-sm">← Back</button>
          <span className="font-mono text-sm text-slate-400">{formatOrderNumber(order.orderNumber, order.createdAt)}</span>
          {order.isUnderWarranty && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Under Warranty</span>
          )}
        </div>
        <select
          className={`text-xs px-3 py-1.5 rounded-full font-medium border-0 focus:outline-none cursor-pointer ${STATUS_COLORS[order.status]}`}
          value={order.status}
          onChange={(e) => changeStatus(e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Spare Parts Used</h2>
              <button onClick={() => setShowPartForm(!showPartForm)}
                className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                + Add Part
              </button>
            </div>

            {showPartForm && (
              <div className="bg-slate-800 rounded-lg p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Part</label>
                    <select
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      value={selectedPart}
                      onChange={(e) => setSelectedPart(e.target.value)}
                    >
                      <option value="">Select part...</option>
                      {spareParts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {p.unitPrice.toFixed(2)} (stock: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Quantity</label>
                    <input
                      type="number" min="1"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      value={partQty}
                      onChange={(e) => setPartQty(e.target.value)}
                    />
                  </div>
                </div>
                {selectedPartData && (
                  <p className="text-xs text-slate-400">
                    Total: <span className="text-white font-medium">{(selectedPartData.unitPrice * parseInt(partQty || "1")).toFixed(2)}</span>
                  </p>
                )}
                <div className="flex gap-2">
                  <button onClick={addPart} disabled={addingPart || !selectedPart}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors"
                  >
                    {addingPart ? "Adding..." : "Add"}
                  </button>
                  <button onClick={() => setShowPartForm(false)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

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
          {/* Assign Engineer */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Assigned Engineer</h2>
            <select
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              value={order.assignee?.id ?? ""}
              onChange={(e) => assignEngineer(e.target.value)}
            >
              <option value="">Unassigned</option>
              {engineers.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </section>

          {/* Quotation */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quotation</h2>
              <button onClick={() => setEditingQuotation(!editingQuotation)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {editingQuotation ? "Cancel" : "Edit"}
              </button>
            </div>

            {editingQuotation ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Discount</label>
                  <input type="number" min="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Collected</label>
                  <input type="number" min="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    value={collected}
                    onChange={(e) => setCollected(e.target.value)}
                  />
                </div>
                <button onClick={saveQuotation} disabled={savingQuotation}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors"
                >
                  {savingQuotation ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
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
            )}
          </section>

          {/* Operation Log */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Operation Log</h2>
            <div className="space-y-3">
              {order.logs.map((log) => (
                <div key={log.id} className="text-xs border-b border-slate-800/50 pb-2">
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