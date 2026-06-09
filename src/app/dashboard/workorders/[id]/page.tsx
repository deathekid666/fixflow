"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import RatingModal from "@/components/RatingModal";
import { useAuth } from "@/context/AuthContext";

type LineItem = { id: string; label: string; amount: number };
type Note = { id: string; message: string; createdAt: string; user: { name: string; role: string } };
type Attachment = { id: string; filename: string; path: string; tag: string; createdAt: string };
type Bounce = { id: string; reason: string; scenario: string; createdAt: string };
type Payment = { id: string; amount: number; method: string; note: string | null; createdAt: string; collector: { name: string } };
type CheckItem = { id: string; item: string; status: string; note: string | null };

type WorkOrder = {
  id: string; orderNumber: string; deviceBrand: string; deviceModel: string;
  serialNumber: string; imei: string; warrantyStart: string; warrantyEnd: string;
  isUnderWarranty: boolean; customerName: string; customerPhone: string; customerEmail: string;
  faultDescription: string; appearance: string; remarks: string; serviceType: string;
  repairType: string; faultLevel: string; status: string; receivedAt: string;
  doneAt: string | null; deliveredAt: string | null; bounceCount: number; isBounce: boolean;
  subtotal: number; quotationItems: number; discount: number; total: number;
  collected: number; quotationRemarks: string | null; createdAt: string;
  creator: { name: string }; assignee: { id: string; name: string } | null;
  parts: { id: string; quantity: number; unitPrice: number; total: number; sparePart: { name: string; partNumber: string } }[];
  lineItems: LineItem[];
  logs: { id: string; action: string; description: string; createdAt: string; user: { name: string } }[];
  attachments: Attachment[]; bounces: Bounce[]; notes: Note[];
  tatDays: number; isOverdue: boolean;
  rating?: { rating: number; comment: string | null } | null;
  payments: Payment[];
  checklist: CheckItem[];
};

type Engineer = { id: string; name: string };
type SparePart = { id: string; name: string; partNumber: string; unitPrice: number; stock: number };

const STATUS_OPTIONS = ["RECEIVED", "DIAGNOSING", "REPAIRING", "DONE", "DELIVERED", "CANCELLED"];
const STATUS_COLORS: Record<string, string> = {
  RECEIVED: "bg-blue-500/20 text-blue-400", DIAGNOSING: "bg-yellow-500/20 text-yellow-400",
  REPAIRING: "bg-orange-500/20 text-orange-400", DONE: "bg-green-500/20 text-green-400",
  DELIVERED: "bg-slate-500/20 text-slate-400", CANCELLED: "bg-red-500/20 text-red-400",
};
const BOUNCE_SCENARIOS = [
  { value: "SAME_FAULT_RETURNED", label: "Same fault returned" },
  { value: "NEW_FAULT_AFTER_REPAIR", label: "New fault after repair" },
  { value: "PART_FAILURE", label: "Part failure" },
  { value: "CUSTOMER_MISUSE", label: "Customer misuse" },
  { value: "INCOMPLETE_REPAIR", label: "Incomplete repair" },
  { value: "OTHER", label: "Other" },
];
const METHOD_ICONS: Record<string, string> = {
  CASH: "💵", CARD: "💳", BANK_TRANSFER: "🏦", OTHER: "💰",
};

export default function WorkOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
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
  const [quotationRemarks, setQuotationRemarks] = useState("");
  const [manualTotal, setManualTotal] = useState("0");
  const [savingQuotation, setSavingQuotation] = useState(false);
  const [showBounceForm, setShowBounceForm] = useState(false);
  const [bounceReason, setBounceReason] = useState("");
  const [bounceScenario, setBounceScenario] = useState("");
  const [submittingBounce, setSubmittingBounce] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadTag, setUploadTag] = useState("other");
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentNote, setPaymentNote] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [bankRef, setBankRef] = useState("");
  const [bankName, setBankName] = useState("");
  const [otherDesc, setOtherDesc] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [newCheckItem, setNewCheckItem] = useState("");
  const [addingCheck, setAddingCheck] = useState(false);

  useEffect(() => {
    load();
    fetch("/api/users", { credentials: "include" }).then(r => r.json()).then(setEngineers).catch(() => {});
    fetch("/api/spareparts", { credentials: "include" }).then(r => r.json()).then(setSpareParts).catch(() => {});
  }, []);

  async function load() {
    const res = await fetch(`/api/workorders/${params.id}`, { credentials: "include" });
    if (!res.ok) { router.push("/dashboard"); return; }
    const data = await res.json();
    setOrder(data);
    setDiscount(data.discount.toString());
    setQuotationRemarks(data.quotationRemarks || "");
    setLoading(false);
  }

  async function loadChecklist() {
    await fetch(`/api/workorders/${params.id}/checklist`, { credentials: "include" });
    await load();
  }

  async function updateCheck(checkId: string, status: string) {
    await fetch(`/api/workorders/${params.id}/checklist`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ checkId, status }),
    });
    await load();
  }

  async function addCheckItem() {
    if (!newCheckItem.trim()) return;
    setAddingCheck(true);
    await fetch(`/api/workorders/${params.id}/checklist`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ item: newCheckItem }),
    });
    setNewCheckItem(""); await load(); setAddingCheck(false);
  }

  async function deleteCheckItem(checkId: string) {
    await fetch(`/api/workorders/${params.id}/checklist`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ checkId }),
    });
    await load();
  }

  async function changeStatus(status: string) {
    if (!order) return;
    const prevStatus = order.status;
    const res = await fetch(`/api/workorders/${params.id}/status`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    await load();
    if (status === "DELIVERED" && prevStatus !== "DELIVERED" && !order.rating) setShowRating(true);
  }

  async function deleteOrder() {
    setDeletingOrder(true);
    const res = await fetch(`/api/workorders/${params.id}/edit`, { method: "DELETE", credentials: "include" });
    if (res.ok) { router.push("/dashboard"); }
    else { setDeletingOrder(false); setShowDeleteConfirm(false); }
  }

  async function assignEngineer(assignedTo: string) {
    await fetch(`/api/workorders/${params.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ assignedTo: assignedTo || null }),
    });
    await load();
  }

  async function addPart() {
    if (!selectedPart || !partQty) return;
    setAddingPart(true);
    await fetch(`/api/workorders/${params.id}/parts`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ sparePartId: selectedPart, quantity: parseInt(partQty) }),
    });
    setSelectedPart(""); setPartQty("1"); setShowPartForm(false);
    await load();
    fetch("/api/spareparts", { credentials: "include" }).then(r => r.json()).then(setSpareParts);
    setAddingPart(false);
  }

  async function addLineItem() {
    if (!newItemLabel || !newItemAmount) return;
    setAddingItem(true);
    await fetch(`/api/workorders/${params.id}/lineitems`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ label: newItemLabel, amount: parseFloat(newItemAmount) }),
    });
    setNewItemLabel(""); setNewItemAmount(""); await load(); setAddingItem(false);
  }

  async function deleteLineItem(itemId: string) {
    await fetch(`/api/workorders/${params.id}/lineitems`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ itemId }),
    });
    await load();
  }

  async function saveQuotation() {
    setSavingQuotation(true);
    const d = parseFloat(discount) || 0;
    const autoTotal = (order?.subtotal ?? 0) + (order?.quotationItems ?? 0) - d;
    const finalTotal = autoTotal > 0 ? autoTotal : parseFloat(manualTotal) || 0;
    await fetch(`/api/workorders/${params.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ discount: d, quotationRemarks, total: finalTotal }),
    });
    setEditingQuotation(false); await load(); setSavingQuotation(false);
  }

  async function collectPayment() {
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) return;
    let note = paymentNote;
    if (paymentMethod === "CARD" && cardLast4) note = `Card ending ${cardLast4}${paymentNote ? " · " + paymentNote : ""}`;
    if (paymentMethod === "BANK_TRANSFER") {
      const parts = [bankName, bankRef && `Ref: ${bankRef}`, paymentNote].filter(Boolean);
      note = parts.join(" · ");
    }
    if (paymentMethod === "OTHER") note = otherDesc + (paymentNote ? " · " + paymentNote : "");
    setSavingPayment(true);
    await fetch(`/api/workorders/${params.id}/payments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ amount: amt, method: paymentMethod, note }),
    });
    setPaymentAmount(""); setPaymentNote(""); setCardLast4(""); setBankRef(""); setBankName(""); setOtherDesc("");
    setShowPaymentForm(false); await load(); setSavingPayment(false);
  }

  async function deletePayment(paymentId: string) {
    if (!confirm("Delete this payment?")) return;
    await fetch(`/api/workorders/${params.id}/payments`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ paymentId }),
    });
    await load();
  }

  async function addNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    await fetch(`/api/workorders/${params.id}/notes`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ message: newNote }),
    });
    setNewNote(""); await load(); setAddingNote(false);
  }

  async function submitBounce() {
    if (!bounceReason || !bounceScenario) return;
    setSubmittingBounce(true);
    await fetch(`/api/workorders/${params.id}/bounce`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ reason: bounceReason, scenario: bounceScenario }),
    });
    setBounceReason(""); setBounceScenario(""); setShowBounceForm(false); await load(); setSubmittingBounce(false);
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function confirmUpload() {
    if (!pendingFile) return;
    setUploadingFile(true);
    const fd = new FormData();
    fd.append("file", pendingFile);
    fd.append("tag", uploadTag);
    await fetch(`/api/workorders/${params.id}/attachments`, { method: "POST", credentials: "include", body: fd });
    setPendingFile(null); setUploadTag("other"); await load(); setUploadingFile(false);
  }

  function cancelUpload() { setPendingFile(null); if (fileRef.current) fileRef.current.value = ""; }

  async function deleteAttachment(attachmentId: string) {
    setDeletingAttachmentId(attachmentId);
    await fetch(`/api/workorders/${params.id}/attachments`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ attachmentId }),
    });
    setDeletingAttachmentId(null); await load();
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500 text-sm">Loading...</div>;
  if (!order) return null;

  const selectedPartData = spareParts.find(p => p.id === selectedPart);
  const grandTotal = order.subtotal + order.quotationItems - order.discount;
  const remaining = grandTotal - order.collected;
  const isFullyPaid = remaining <= 0.01 && order.collected > 0 && order.collected <= grandTotal + 0.01;
  const checkOK = order.checklist.filter(c => c.status === "OK").length;
  const checkIssue = order.checklist.filter(c => c.status === "ISSUE").length;
  const checkNA = order.checklist.filter(c => c.status === "NA").length;
  const checkPending = order.checklist.filter(c => c.status === "PENDING").length;

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white text-sm">← Back</button>
          <h1 className="text-white font-bold">
            {order.orderNumber.startsWith("wo-")
              ? order.orderNumber.toUpperCase()
              : `WO-${new Date(order.createdAt).getFullYear()}-${order.orderNumber.slice(0, 6).toUpperCase()}`}
          </h1>
          {order.isBounce && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Bounce ×{order.bounceCount}</span>}
          {order.isOverdue && <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">⚠ Overdue {order.tatDays}d</span>}
          <span className="text-xs text-slate-500">TAT: {order.tatDays} day{order.tatDays !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a href={`/print/${params.id}`} target="_blank" className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors">🖨 Print</a>
          <button onClick={() => router.push(`/dashboard/workorders/${params.id}/edit`)} className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors">✏️ Edit</button>
          <button onClick={() => setShowBounceForm(!showBounceForm)} className="text-xs px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 text-red-400 rounded-lg transition-colors">Report Bounce</button>
          {isAdmin && !showDeleteConfirm && <button onClick={() => setShowDeleteConfirm(true)} className="text-xs px-3 py-1.5 bg-red-700/40 hover:bg-red-700/70 text-red-400 rounded-lg transition-colors">🗑 Delete</button>}
          {isAdmin && showDeleteConfirm && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Delete?</span>
              <button onClick={deleteOrder} disabled={deletingOrder} className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg disabled:opacity-50">{deletingOrder ? "..." : "Yes"}</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-xs px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg">No</button>
            </div>
          )}
          {order.status === "RECEIVED" && (
            <button onClick={() => changeStatus("DIAGNOSING")} className="text-xs px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-colors font-medium">
              → Start Diagnosis
            </button>
          )}
          {order.status === "DIAGNOSING" && (
            <button onClick={() => changeStatus("REPAIRING")} className="text-xs px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors font-medium">
              → Start Repair
            </button>
          )}
          {order.status === "REPAIRING" && (
            <button onClick={() => changeStatus("DONE")} className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium">
              → Mark Done
            </button>
          )}
          {order.status === "DONE" && (
            <button onClick={() => changeStatus("DELIVERED")} className="text-xs px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors font-medium">
              → Mark Delivered
            </button>
          )}
          <select className={`text-xs px-3 py-1.5 rounded-full font-medium border-0 focus:outline-none cursor-pointer ${STATUS_COLORS[order.status] ?? "bg-slate-700 text-slate-300"}`}
            value={order.status} onChange={(e) => changeStatus(e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Bounce form */}
      {showBounceForm && (
        <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-red-400">Report Bounce Repair</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Scenario</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" value={bounceScenario} onChange={(e) => setBounceScenario(e.target.value)}>
                <option value="">Select...</option>
                {BOUNCE_SCENARIOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Reason</label>
              <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none" placeholder="Describe..." value={bounceReason} onChange={(e) => setBounceReason(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submitBounce} disabled={submittingBounce || !bounceReason || !bounceScenario} className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs rounded-lg">{submittingBounce ? "..." : "Submit"}</button>
            <button onClick={() => setShowBounceForm(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">

          {/* Device info */}
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

          {/* Customer info */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Customer Information</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Name" value={order.customerName} />
              <Info label="Phone" value={order.customerPhone} />
              <Info label="Email" value={order.customerEmail || "—"} />
            </div>
          </section>

          {/* Fault & service */}
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

          {/* Spare parts */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Spare Parts</h2>
              <button onClick={() => setShowPartForm(!showPartForm)} className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">+ Add Part</button>
            </div>
            {showPartForm && (
              <div className="bg-slate-800 rounded-lg p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Part</label>
                    <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" value={selectedPart} onChange={(e) => setSelectedPart(e.target.value)}>
                      <option value="">Select part...</option>
                      {spareParts.map(p => <option key={p.id} value={p.id}>{p.name} — {p.unitPrice.toFixed(2)} (stock: {p.stock})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Quantity</label>
                    <input type="number" min="1" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" value={partQty} onChange={(e) => setPartQty(e.target.value)} />
                  </div>
                </div>
                {selectedPartData && <p className="text-xs text-slate-400">Total: <span className="text-white font-medium">{(selectedPartData.unitPrice * parseInt(partQty || "1")).toFixed(2)}</span></p>}
                <div className="flex gap-2">
                  <button onClick={addPart} disabled={addingPart || !selectedPart} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg">{addingPart ? "Adding..." : "Add"}</button>
                  <button onClick={() => setShowPartForm(false)} className="px-3 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-lg">Cancel</button>
                </div>
              </div>
            )}
            {order.parts.length === 0 ? <p className="text-sm text-slate-500">No parts added yet.</p> : (
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

          {/* Attachments */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Attachments</h2>
              <button onClick={() => fileRef.current?.click()} disabled={uploadingFile || !!pendingFile} className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors">{uploadingFile ? "Uploading..." : "Upload File"}</button>
              <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.txt" onChange={onFileSelected} />
            </div>
            {pendingFile && (
              <div className="mb-4 bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-blue-300 font-medium">{pendingFile.name}</p>
                  <p className="text-xs text-slate-400">{(pendingFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Photo stage</label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { key: "intake", icon: "📥", label: "Intake" },
                      { key: "repair", icon: "🔧", label: "Repair" },
                      { key: "completion", icon: "✅", label: "Done" },
                      { key: "other", icon: "📄", label: "Other" },
                    ].map(t => (
                      <button key={t.key} onClick={() => setUploadTag(t.key)}
                        className={`py-1.5 rounded-lg text-xs font-medium transition-colors flex flex-col items-center gap-0.5 ${uploadTag === t.key ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={confirmUpload} disabled={uploadingFile} className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg disabled:opacity-50">{uploadingFile ? "Uploading..." : "Confirm Upload"}</button>
                  <button onClick={cancelUpload} className="px-3 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-lg">Cancel</button>
                </div>
              </div>
            )}
            {order.attachments.length === 0 ? <p className="text-sm text-slate-500">No attachments yet.</p> : (
              <div className="grid grid-cols-3 gap-3">
                {order.attachments.map(a => (
                  <div key={a.id} className="bg-slate-800 rounded-lg overflow-hidden group relative">
                    {a.path.startsWith("data:image") || a.path.startsWith("https://") ? (
                      <img src={a.path} alt={a.filename} className="w-full h-24 object-cover" />
                    ) : (
                      <div className="h-24 flex items-center justify-center text-slate-400 text-xs">📄 {a.filename}</div>
                    )}
                    <div className="px-2 py-1 flex items-center justify-between gap-1">
                      <p className="text-xs text-slate-500 truncate">{a.filename}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                        a.tag === "intake" ? "bg-blue-500/20 text-blue-400" :
                        a.tag === "repair" ? "bg-orange-500/20 text-orange-400" :
                        a.tag === "completion" ? "bg-green-500/20 text-green-400" :
                        "bg-slate-700 text-slate-400"
                      }`}>
                        {a.tag === "intake" ? "📥" : a.tag === "repair" ? "🔧" : a.tag === "completion" ? "✅" : "📄"}
                      </span>
                    </div>
                    <button onClick={() => { if (confirm(`Delete "${a.filename}"?`)) deleteAttachment(a.id); }} disabled={deletingAttachmentId === a.id}
                      className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50">×</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Diagnosis Checklist */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Diagnosis Checklist</h2>
                {order.checklist.length > 0 && (
                  <p className="text-xs text-slate-600 mt-0.5">{order.checklist.filter(c => c.status !== "PENDING").length}/{order.checklist.length} checked</p>
                )}
              </div>
              {order.checklist.length === 0 && (
                <button onClick={loadChecklist} className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">+ Load Checklist</button>
              )}
            </div>
            {order.checklist.length === 0 ? (
              <p className="text-sm text-slate-500">Click "Load Checklist" to start diagnosis.</p>
            ) : (
              <div className="space-y-2">
                {order.checklist.map(check => (
                  <div key={check.id} className="flex items-start gap-3 group">
                    <div className="flex gap-1 flex-shrink-0 mt-0.5">
                      {[
                        { s: "OK", icon: "✓", title: "OK", active: "bg-green-600 text-white", inactive: "bg-slate-800 text-slate-600 hover:bg-green-900 hover:text-green-400" },
                        { s: "ISSUE", icon: "!", title: "Issue", active: "bg-red-600 text-white", inactive: "bg-slate-800 text-slate-600 hover:bg-red-900 hover:text-red-400" },
                        { s: "NA", icon: "—", title: "N/A", active: "bg-slate-600 text-white", inactive: "bg-slate-800 text-slate-600 hover:bg-slate-700" },
                        { s: "PENDING", icon: "○", title: "Pending", active: "bg-slate-700 text-slate-400", inactive: "bg-slate-800 text-slate-600 hover:bg-slate-700" },
                      ].map(btn => (
                        <button key={btn.s} onClick={() => updateCheck(check.id, btn.s)} title={btn.title}
                          className={`w-6 h-6 rounded text-xs font-bold transition-all ${check.status === btn.s ? btn.active : btn.inactive}`}>
                          {btn.icon}
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                      <p className={`text-xs mt-1 ${
                        check.status === "OK" ? "text-green-400" :
                        check.status === "ISSUE" ? "text-red-400" :
                        check.status === "NA" ? "text-slate-600 line-through" : "text-slate-300"
                      }`}>{check.item}</p>
                      <button onClick={() => deleteCheckItem(check.id)} className="text-slate-700 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">×</button>
                    </div>
                  </div>
                ))}
                {order.checklist.length > 0 && (
                  <div className="pt-3 mt-1 border-t border-slate-800">
                    <div className="flex gap-3 text-xs mb-2">
                      <span className="text-green-400">✓ {checkOK} OK</span>
                      <span className="text-red-400">! {checkIssue} Issues</span>
                      <span className="text-slate-500">— {checkNA} N/A</span>
                      <span className="text-slate-600">○ {checkPending} Pending</span>
                    </div>
                    <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-800">
                      <div className="bg-green-500 h-full transition-all" style={{ width: `${(checkOK / order.checklist.length) * 100}%` }} />
                      <div className="bg-red-500 h-full transition-all" style={{ width: `${(checkIssue / order.checklist.length) * 100}%` }} />
                      <div className="bg-slate-600 h-full transition-all" style={{ width: `${(checkNA / order.checklist.length) * 100}%` }} />
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <input className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="Add custom check item..." value={newCheckItem}
                    onChange={e => setNewCheckItem(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addCheckItem(); }} />
                  <button onClick={addCheckItem} disabled={addingCheck || !newCheckItem.trim()}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 text-xs rounded-lg transition-colors">
                    {addingCheck ? "..." : "+ Add"}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Bounce history */}
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

        {/* Right sidebar */}
        <div className="space-y-4">
          <section className={`border rounded-xl p-5 ${order.isOverdue ? "bg-orange-950/20 border-orange-800/30" : "bg-slate-900 border-slate-800"}`}>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Turnaround Time</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Received</span><span className="text-white">{new Date(order.receivedAt).toLocaleDateString()}</span></div>
              {order.doneAt && <div className="flex justify-between"><span className="text-slate-400">Done</span><span className="text-white">{new Date(order.doneAt).toLocaleDateString()}</span></div>}
              {order.deliveredAt && <div className="flex justify-between"><span className="text-slate-400">Delivered</span><span className="text-white">{new Date(order.deliveredAt).toLocaleDateString()}</span></div>}
              <div className={`flex justify-between font-semibold border-t border-slate-700 pt-2 mt-2 ${order.isOverdue ? "text-orange-400" : "text-white"}`}>
                <span>Total TAT</span><span>{order.tatDays} day{order.tatDays !== 1 ? "s" : ""} {order.isOverdue ? "⚠️" : ""}</span>
              </div>
            </div>
          </section>

          {order.status === "DELIVERED" && (
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Customer Rating</h2>
              {order.rating ? (
                <div>
                  <div className="text-yellow-400 text-xl mb-1">{"★".repeat(order.rating.rating)}<span className="text-slate-600">{"★".repeat(5 - order.rating.rating)}</span></div>
                  {order.rating.comment && <p className="text-xs text-slate-400 italic">"{order.rating.comment}"</p>}
                </div>
              ) : (
                <div>
                  <p className="text-xs text-slate-500 mb-2">No rating yet.</p>
                  <button onClick={() => setShowRating(true)} className="text-xs px-3 py-1.5 bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-400 rounded-lg transition-colors">★ Collect Rating</button>
                </div>
              )}
            </section>
          )}

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Assigned Engineer</h2>
            <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" value={order.assignee?.id ?? ""} onChange={(e) => assignEngineer(e.target.value)}>
              <option value="">Unassigned</option>
              {engineers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quotation</h2>
              <button onClick={() => setEditingQuotation(!editingQuotation)} className="text-xs text-blue-400 hover:text-blue-300">{editingQuotation ? "Cancel" : "Edit"}</button>
            </div>
            {grandTotal === 0 && (
              <div className="bg-yellow-950/30 border border-yellow-800/50 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
                <span className="text-yellow-400">⚠</span>
                <span className="text-xs text-yellow-300">No price set — add a labor fee or service below, or set total manually in Edit</span>
              </div>
            )}
            <div className="space-y-1 mb-3">
              {order.lineItems.map(item => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{item.label}</span>
                  <div className="flex items-center gap-2"><span className="text-white">{item.amount.toFixed(2)}</span><button onClick={() => deleteLineItem(item.id)} className="text-red-400 hover:text-red-300">×</button></div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mb-3">
              <input className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none" placeholder="e.g. Labor fee, Screen repair..." value={newItemLabel} onChange={(e) => setNewItemLabel(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && newItemLabel && newItemAmount) addLineItem(); }} />
              <input className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none" placeholder="Price MAD" type="number" value={newItemAmount} onChange={(e) => setNewItemAmount(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && newItemLabel && newItemAmount) addLineItem(); }} />
              <button onClick={addLineItem} disabled={addingItem || !newItemLabel || !newItemAmount} className="px-2 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded">+ Add</button>
            </div>
            <p className="text-xs text-slate-600 mb-3">Add labor fees and services above — total updates automatically</p>
            <div className="space-y-1.5 text-sm mb-4">
              {order.subtotal > 0 && <div className="flex justify-between text-slate-400"><span>Parts</span><span>{order.subtotal.toFixed(2)}</span></div>}
              {order.quotationItems > 0 && <div className="flex justify-between text-slate-400"><span>Services</span><span>{order.quotationItems.toFixed(2)}</span></div>}
              {order.discount > 0 && <div className="flex justify-between text-slate-400"><span>Discount</span><span>-{order.discount.toFixed(2)}</span></div>}
              <div className="flex justify-between text-white font-bold border-t border-slate-700 pt-2"><span>Total</span><span>{grandTotal.toFixed(2)} MAD</span></div>
            </div>
            {editingQuotation && (
              <div className="space-y-3 mb-4 bg-slate-800 rounded-lg p-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Total (MAD)</label>
                  <input type="number" min="0" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" value={manualTotal} onChange={(e) => setManualTotal(e.target.value)}
                    placeholder="Set total manually if no parts added" />
                  <p className="text-xs text-slate-600 mt-0.5">Auto-calculated from parts + services when available</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Discount</label>
                  <input type="number" min="0" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Quotation Remarks</label>
                  <textarea rows={2} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none resize-none" value={quotationRemarks} onChange={(e) => setQuotationRemarks(e.target.value)} />
                </div>
                <button onClick={saveQuotation} disabled={savingQuotation} className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg">{savingQuotation ? "Saving..." : "Save"}</button>
              </div>
            )}
            <div className="border border-slate-700 rounded-lg overflow-hidden">
              <div className="bg-slate-800 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400 font-medium">Total: {grandTotal.toFixed(2)} MAD</span>
                  <span className="text-green-400 font-medium">Paid: {order.collected.toFixed(2)} MAD</span>
                  {remaining > 0.01 && <span className="text-red-400 font-medium">Due: {remaining.toFixed(2)} MAD</span>}
                  {isFullyPaid && order.collected <= grandTotal + 0.01 && <span className="text-green-400 font-medium">✓ Fully paid</span>}
                  {order.collected > grandTotal + 0.01 && <span className="text-orange-400 font-medium">⚠ Overpaid {(order.collected - grandTotal).toFixed(2)} MAD</span>}
                  {grandTotal === 0 && <span className="text-yellow-400 font-medium">⚠ Add a service fee above</span>}
                </div>
                <button onClick={() => setShowPaymentForm(!showPaymentForm)}
                  className="text-xs px-2.5 py-1 bg-green-600 hover:bg-green-500 text-white rounded-md font-medium transition-colors whitespace-nowrap">
                  + Payment
                </button>
              </div>
              {showPaymentForm && (
                <div className="bg-slate-800/50 border-t border-slate-700 p-3 space-y-3">
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { key: "CASH", icon: "💵", label: "Cash" },
                      { key: "CARD", icon: "💳", label: "Card" },
                      { key: "BANK_TRANSFER", icon: "🏦", label: "Bank" },
                      { key: "OTHER", icon: "💰", label: "Other" },
                    ].map(m => (
                      <button key={m.key} onClick={() => setPaymentMethod(m.key)}
                        className={`py-2 rounded-lg text-xs font-medium transition-colors flex flex-col items-center gap-0.5 ${paymentMethod === m.key ? "bg-green-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"}`}>
                        <span className="text-base">{m.icon}</span>
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Amount (MAD) *</label>
                    <input type="number" min="0" placeholder="0.00"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                      value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                  </div>
                  {paymentMethod === "CARD" && (
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Last 4 digits</label>
                      <input type="text" maxLength={4} placeholder="1234"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-green-500"
                        value={cardLast4} onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ""))} />
                    </div>
                  )}
                  {paymentMethod === "BANK_TRANSFER" && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Bank name</label>
                        <input type="text" placeholder="e.g. CIH, Attijariwafa"
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                          value={bankName} onChange={(e) => setBankName(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Reference number</label>
                        <input type="text" placeholder="REF-XXXXXXXX"
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-green-500"
                          value={bankRef} onChange={(e) => setBankRef(e.target.value)} />
                      </div>
                    </div>
                  )}
                  {paymentMethod === "OTHER" && (
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Description *</label>
                      <input type="text" placeholder="e.g. Cheque, PayPal"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                        value={otherDesc} onChange={(e) => setOtherDesc(e.target.value)} />
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Note (optional)</label>
                    <input type="text" placeholder="Any additional note..."
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
                      value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={collectPayment} disabled={savingPayment || !paymentAmount || (paymentMethod === "OTHER" && !otherDesc)}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg">
                      {savingPayment ? "Saving..." : "Record Payment"}
                    </button>
                    <button onClick={() => setShowPaymentForm(false)} className="px-3 py-2 bg-slate-700 text-slate-300 text-xs rounded-lg">Cancel</button>
                  </div>
                </div>
              )}
              {order.payments && order.payments.length > 0 && (
                <div className="border-t border-slate-700">
                  <div className="px-3 py-2 bg-slate-800/30">
                    <p className="text-xs text-slate-500 font-medium">Payment history ({order.payments.length})</p>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {order.payments.map((p) => (
                      <div key={p.id} className="px-3 py-2 flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className="text-base mt-0.5">{METHOD_ICONS[p.method] ?? "💰"}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-white font-medium">{p.amount.toFixed(2)} MAD</span>
                              <span className="text-xs text-slate-500">{p.method.replace("_", " ")}</span>
                            </div>
                            {p.note && <p className="text-xs text-slate-400 mt-0.5 truncate">{p.note}</p>}
                            <p className="text-xs text-slate-600 mt-0.5">{p.collector.name} · {new Date(p.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {isAdmin && <button onClick={() => deletePayment(p.id)} className="text-red-400 hover:text-red-300 text-xs flex-shrink-0 mt-1">×</button>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Customer Tracking</h2>
            <p className="text-xs text-slate-400 mb-3">Share this link with the customer:</p>
            <div className="bg-slate-800 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
              <span className="text-xs text-blue-400 font-mono truncate">{typeof window !== "undefined" ? `${window.location.origin}/track/${order.orderNumber.slice(0, 6)}` : ""}</span>
              <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/track/${order.orderNumber.slice(0, 6)}`)} className="text-xs text-slate-400 hover:text-white flex-shrink-0">Copy</button>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Internal Notes</h2>
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {(!order.notes || order.notes.length === 0) && <p className="text-xs text-slate-500">No notes yet.</p>}
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
              <input className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" placeholder="Add an internal note..." value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addNote(); }} />
              <button onClick={addNote} disabled={addingNote || !newNote.trim()} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg">{addingNote ? "..." : "Add"}</button>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Operation Log</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {order.logs.map(log => {
                const isStatusChange = log.action === "STATUS_CHANGED";
                const newStatus = isStatusChange
                  ? STATUS_OPTIONS.find(s => log.description.includes(s))
                  : null;
                return (
                  <div key={log.id} className={`text-xs border-b border-slate-800/50 pb-2 ${isStatusChange ? "bg-slate-800/40 rounded-lg px-3 py-2 border-0" : ""}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {isStatusChange && newStatus ? (
                          <>
                            <span className="text-slate-400 font-medium">Status →</span>
                            <span className={`px-2 py-0.5 rounded-full font-semibold text-xs ${STATUS_COLORS[newStatus]}`}>
                              {newStatus}
                            </span>
                          </>
                        ) : (
                          <span className="text-blue-400 font-medium">{log.action.replace(/_/g, " ")}</span>
                        )}
                      </div>
                      <span className="text-slate-600 font-mono text-xs flex-shrink-0">{new Date(log.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}</span>
                    </div>
                    {(!isStatusChange || !newStatus) && (
                      <p className="text-slate-400 mt-0.5">{log.description}</p>
                    )}
                    <p className="text-slate-600 mt-0.5">by {log.user.name}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs space-y-2">
            <Info label="Created by" value={order.creator.name} />
            <Info label="Created" value={new Date(order.createdAt).toLocaleString()} />
          </section>
        </div>
      </div>

      {showRating && (
        <RatingModal workOrderId={order.id} orderNumber={order.orderNumber} customerName={order.customerName}
          onClose={() => setShowRating(false)} onSubmitted={() => { setShowRating(false); load(); }} />
      )}
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