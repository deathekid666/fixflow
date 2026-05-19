"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type LineItem = { id: string; label: string; amount: number };
type Note = { id: string; message: string; createdAt: string; user: { name: string; role: string } };
type Attachment = { id: string; filename: string; path: string; createdAt: string };
type Bounce = { id: string; reason: string; scenario: string; createdAt: string };

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
  isOverdue: boolean;
  bounceCount: number;
  isBounce: boolean;
  subtotal: number;
  quotationItems: number;
  discount: number;
  total: number;
  collected: number;
  quotationRemarks: string | null;
  createdAt: string;
  creator: { name: string };
  assignee: { id: string; name: string } | null;
  parts: { id: string; quantity: number; unitPrice: number; total: number; sparePart: { name: string; partNumber: string } }[];
  lineItems: LineItem[];
  logs: { id: string; action: string; description: string; createdAt: string; user: { name: string } }[];
  attachments: Attachment[];
  bounces: Bounce[];
  notes: Note[];
  tatDays: number;
  isOverdue: boolean;
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

const BOUNCE_SCENARIOS = [
  { value: "SAME_FAULT_RETURNED", label: "Same fault returned" },
  { value: "NEW_FAULT_AFTER_REPAIR", label: "New fault after repair" },
  { value: "PART_FAILURE", label: "Part failure" },
  { value: "CUSTOMER_MISUSE", label: "Customer misuse" },
  { value: "INCOMPLETE_REPAIR", label: "Incomplete repair" },
  { value: "OTHER", label: "Other" },
];

function formatWO(raw: string, date: string) {
  return `WO-${new Date(date).getFullYear()}-${raw.slice(0, 6).toUpperCase()}`;
}

export default function WorkOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);

  const [showPartForm, setShowPartForm] = useState(false);
  const [selectedPart, setSelectedPart] = useState("");
  const [partQty, setPartQty] = useState("1");
  const [addingPart, setAddingPart] = useState(false);

  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  const [editingQuotation, setEditingQuotation] = useState(false);
  const [discount, setDiscount] = useState("0");
  const [collected, setCollected] = useState("0");
  const [quotationRemarks, setQuotationRemarks] = useState("");
  const [savingQuotation, setSavingQuotation] = useState(false);

  const [showBounceForm, setShowBounceForm] = useState(false);
  const [bounceReason, setBounceReason] = useState("");
  const [bounceScenario, setBounceScenario] = useState("");
  const [submittingBounce, setSubmittingBounce] = useState(false);

  const [uploadingFile, setUploadingFile] = useState(false);

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
    setQuotationRemarks(data.quotationRemarks || "");
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
    setSelectedPart(""); setPartQty("1"); setShowPartForm(false);
    await load();
    fetch("/api/spareparts").then(r => r.json()).then(setSpareParts);
    setAddingPart(false);
  }

  async function addLineItem() {
    if (!newItemLabel || !newItemAmount) return;
    setAddingItem(true);
    await fetch(`/api/workorders/${params.id}/lineitems`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newItemLabel, amount: parseFloat(newItemAmount) }),
    });
    setNewItemLabel(""); setNewItemAmount("");
    await load();
    setAddingItem(false);
  }

  async function deleteLineItem(itemId: string) {
    await fetch(`/api/workorders/${params.id}/lineitems`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    await load();
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
        quotationRemarks,
        total: (order?.subtotal ?? 0) + (order?.quotationItems ?? 0) - d,
      }),
    });
    setEditingQuotation(false);
    await load();
    setSavingQuotation(false);
  }

  async function addNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    await fetch(`/api/workorders/${params.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: newNote }),
    });
    setNewNote("");
    await load();
    setAddingNote(false);
  }

  async function submitBounce() {
    if (!bounceReason || !bounceScenario) return;
    setSubmittingBounce(true);
    await fetch(`/api/workorders/${params.id}/bounce`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: bounceReason, scenario: bounceScenario }),
    });
    setBounceReason(""); setBounceScenario(""); setShowBounceForm(false);
    await load();
    setSubmittingBounce(false);
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    const fd = new FormData();
    fd.append("file", file);
    await fetch(`/api/workorders/${params.id}/attachments`, { method: "POST", body: fd });
    await load();
    setUploadingFile(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Loading...</div>;
  if (!order) return null;

  const selectedPartData = spareParts.find(p => p.id === selectedPart);
  const grandTotal = order.subtotal + order.quotationItems - order.discount;

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white text-sm">← Back</button>
          <span className="font-mono text-sm text-slate-400">{formatWO(order.orderNumber, order.createdAt)}</span>
          {order.isUnderWarranty && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Warranty</span>}
          {order.isBounce && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">⚠️ Bounce ×{order.bounceCount}</span>}
          {order.isOverdue && <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">⏰ Overdue {order.tatDays}d</span>}
          <span className="text-xs text-slate-500">TAT: {order.tatDays} day{order.tatDays !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/print/${params.id}`} target="_blank"
            className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
          >
            🖨️ Print
          </a>
          <button onClick={() => setShowBounceForm(!showBounceForm)}
            className="text-xs px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 text-red-400 rounded-lg transition-colors"
          >
            Report Bounce
          </button>
          <select
            className={`text-xs px-3 py-1.5 rounded-full font-medium border-0 focus:outline-none cursor-pointer ${STATUS_COLORS[order.status]}`}
            value={order.status}
            onChange={(e) => changeStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {showBounceForm && (
        <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-red-400">Report Bounce Repair</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Scenario</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                value={bounceScenario} onChange={(e) => setBounceScenario(e.target.value)}>
                <option value="">Select scenario...</option>
                {BOUNCE_SCENARIOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Reason</label>
              <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                placeholder="Describe the issue..." value={bounceReason} onChange={(e) => setBounceReason(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submitBounce} disabled={submittingBounce || !bounceReason || !bounceScenario}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors">
              {submittingBounce ? "Submitting..." : "Submit Bounce"}
            </button>
            <button onClick={() => setShowBounceForm(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
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

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Customer Information</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Name" value={order.customerName} />
              <Info label="Phone" value={order.customerPhone} />
              <Info label="Email" value={order.customerEmail || "—"} />
            </div>
          </section>

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

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Spare Parts</h2>
              <button onClick={() => setShowPartForm(!showPartForm)}
                className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                + Add Part
              </button>
            </div>
            {showPartForm && (
              <div className="bg-slate-800 rounded-lg p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Part</label>
                    <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      value={selectedPart} onChange={(e) => setSelectedPart(e.target.value)}>
                      <option value="">Select part...</option>
                      {spareParts.map(p => (
                        <option key={p.id} value={p.id}>{p.name} — {p.unitPrice.toFixed(2)} (stock: {p.stock})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Quantity</label>
                    <input type="number" min="1"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      value={partQty} onChange={(e) => setPartQty(e.target.value)} />
                  </div>
                </div>
                {selectedPartData && (
                  <p className="text-xs text-slate-400">Total: <span className="text-white font-medium">{(selectedPartData.unitPrice * parseInt(partQty || "1")).toFixed(2)}</span></p>
                )}
                <div className="flex gap-2">
                  <button onClick={addPart} disabled={addingPart || !selectedPart}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg">
                    {addingPart ? "Adding..." : "Add"}
                  </button>
                  <button onClick={() => setShowPartForm(false)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg">Cancel</button>
                </div>
              </div>
            )}
            {order.parts.length === 0 ? (
              <p className="text-sm text-slate-500">No parts added yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-800">
                  <th className="text-left pb-2 text-xs text-slate-500">Part</th>
                  <th className="text-left pb-2 text-xs text-slate-500">Part #</th>
                  <th className="text-right pb-2 text-xs text-slate-500">Qty</th>
                  <th className="text-right pb-2 text-xs text-slate-500">Price</th>
                  <th className="text-right pb-2 text-xs text-slate-500">Total</th>
                </tr></thead>
                <tbody>
                  {order.parts.map(p => (
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

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Attachments</h2>
              <button onClick={() => fileRef.current?.click()} disabled={uploadingFile}
                className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors">
                {uploadingFile ? "Uploading..." : "Upload File"}
              </button>
              <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.txt" onChange={uploadFile} />
            </div>
            {order.attachments.length === 0 ? (
              <p className="text-sm text-slate-500">No attachments yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {order.attachments.map(a => (
                  <div key={a.id} className="bg-slate-800 rounded-lg overflow-hidden">
                    {a.path.startsWith("data:image") ? (
                      <img src={a.path} alt={a.filename} className="w-full h-24 object-cover" />
                    ) : (
                      <div className="h-24 flex items-center justify-center text-slate-400 text-xs">📄 {a.filename}</div>
                    )}
                    <p className="text-xs text-slate-500 px-2 py-1 truncate">{a.filename}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {order.bounces.length > 0 && (
            <section className="bg-red-950/20 border border-red-800/30 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-4">Bounce History ({order.bounces.length})</h2>
              <div className="space-y-3">
                {order.bounces.map((b, i) => (
                  <div key={b.id} className="text-xs border-b border-red-800/20 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-red-400 font-medium">Bounce #{i + 1} — {b.scenario.replace(/_/g, " ")}</span>
                      <span className="text-slate-600">{new Date(b.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-400 mt-0.5">{b.reason}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <section className={`border rounded-xl p-5 ${order.isOverdue ? "bg-orange-950/20 border-orange-800/30" : "bg-slate-900 border-slate-800"}`}>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Turnaround Time</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Received</span>
                <span className="text-white">{new Date(order.receivedAt).toLocaleDateString()}</span>
              </div>
              {order.doneAt && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Done</span>
                  <span className="text-white">{new Date(order.doneAt).toLocaleDateString()}</span>
                </div>
              )}
              {order.deliveredAt && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Delivered</span>
                  <span className="text-white">{new Date(order.deliveredAt).toLocaleDateString()}</span>
                </div>
              )}
              <div className={`flex justify-between font-semibold border-t border-slate-700 pt-2 mt-2 ${order.isOverdue ? "text-orange-400" : "text-white"}`}>
                <span>Total TAT</span>
                <span>{order.tatDays} day{order.tatDays !== 1 ? "s" : ""} {order.isOverdue ? "⚠️" : ""}</span>
              </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Assigned Engineer</h2>
            <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              value={order.assignee?.id ?? ""} onChange={(e) => assignEngineer(e.target.value)}>
              <option value="">Unassigned</option>
              {engineers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quotation</h2>
              <button onClick={() => setEditingQuotation(!editingQuotation)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                {editingQuotation ? "Cancel" : "Edit"}
              </button>
            </div>

            <div className="space-y-1 mb-3">
              {order.lineItems.map(item => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white">{item.amount.toFixed(2)}</span>
                    <button onClick={() => deleteLineItem(item.id)} className="text-red-400 hover:text-red-300">×</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-3">
              <input className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                placeholder="e.g. Labor fee" value={newItemLabel} onChange={(e) => setNewItemLabel(e.target.value)} />
              <input className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                placeholder="0.00" type="number" value={newItemAmount} onChange={(e) => setNewItemAmount(e.target.value)} />
              <button onClick={addLineItem} disabled={addingItem || !newItemLabel || !newItemAmount}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded transition-colors">+</button>
            </div>

            <div className="space-y-2 text-sm mb-3">
              {order.subtotal > 0 && (
                <div className="flex justify-between text-slate-400"><span>Parts</span><span>{order.subtotal.toFixed(2)}</span></div>
              )}
              {order.quotationItems > 0 && (
                <div className="flex justify-between text-slate-400"><span>Services</span><span>{order.quotationItems.toFixed(2)}</span></div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-slate-400"><span>Discount</span><span>-{order.discount.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between text-white font-semibold border-t border-slate-800 pt-2 mt-2">
                <span>Total</span><span>{grandTotal.toFixed(2)}</span>
              </div>
              {order.quotationRemarks && (
                <p className="text-xs text-slate-500 mt-1">{order.quotationRemarks}</p>
              )}
            </div>

            <div className="bg-slate-800 rounded-lg p-3 space-y-2 mb-3">
              <label className="text-xs text-slate-400 block">Collect Payment</label>
              <div className="flex gap-2 items-center">
                <input type="number" min="0"
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                  value={collected} onChange={(e) => setCollected(e.target.value)} />
                <button onClick={saveQuotation} disabled={savingQuotation}
                  className="px-3 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors font-medium">
                  {savingQuotation ? "..." : "Save"}
                </button>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-400">Collected: {order.collected.toFixed(2)}</span>
                {grandTotal - order.collected > 0 && (
                  <span className="text-red-400">Remaining: {(grandTotal - order.collected).toFixed(2)}</span>
                )}
              </div>
            </div>

            {editingQuotation && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Discount</label>
                  <input type="number" min="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    value={discount} onChange={(e) => setDiscount(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Quotation Remarks</label>
                  <textarea rows={2}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Optional remarks..." value={quotationRemarks} onChange={(e) => setQuotationRemarks(e.target.value)} />
                </div>
                <button onClick={saveQuotation} disabled={savingQuotation}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors">
                  {savingQuotation ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </section>

          {/* QR Code */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Customer Tracking</h2>
            <p className="text-xs text-slate-400 mb-3">Share this link with the customer to track repair status:</p>
            <div className="bg-slate-800 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
              <span className="text-xs text-blue-400 font-mono truncate">
                {typeof window !== "undefined" ? `${window.location.origin}/track/${order.orderNumber.slice(0, 6)}` : ""}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/track/${order.orderNumber.slice(0, 6)}`)}
                className="text-xs text-slate-400 hover:text-white transition-colors flex-shrink-0"
              >
                Copy
              </button>
            </div>
          </section>

          {/* Internal Notes */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Internal Notes</h2>
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {(!order.notes || order.notes.length === 0) && (
                <p className="text-xs text-slate-500">No notes yet.</p>
              )}
              {order.notes?.map(note => (
                <div key={note.id} className="bg-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-blue-400 font-medium">{note.user.name}</span>
                    <span className="text-xs text-slate-600">{new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-300">{note.message}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                placeholder="Add an internal note..."
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addNote(); }}
              />
              <button onClick={addNote} disabled={addingNote || !newNote.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg transition-colors">
                {addingNote ? "..." : "Add"}
              </button>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Operation Log</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {order.logs.map(log => (
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