"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import RatingModal from "@/components/RatingModal";
import SocialShareModal from "@/components/SocialShareModal";
import { useAuth } from "@/context/AuthContext";
import { loyaltyTier } from "@/lib/loyaltyTier";
import { formatCurrency } from "@/lib/currency";
import { buildWaUrl, fillTemplate, DEFAULT_TEMPLATES, statusLabel, APP_URL } from "@/lib/whatsapp";

type LineItem = { id: string; label: string; amount: number };
type Note = { id: string; message: string; createdAt: string; user: { name: string; role: string } };
type Attachment = { id: string; filename: string; path: string; tag: string; createdAt: string };
type Bounce = { id: string; reason: string; scenario: string; createdAt: string };
type Payment = { id: string; amount: number; method: string; note: string | null; createdAt: string; collector: { name: string } };
type CheckItem = { id: string; item: string; status: string; note: string | null };
type CustomerMessage = { id: string; message: string; senderType: string; read: boolean; createdAt: string };

type WorkOrder = {
  id: string; orderNumber: string; deviceBrand: string; deviceModel: string;
  serialNumber: string; imei: string; warrantyStart: string; warrantyEnd: string;
  isUnderWarranty: boolean; customerName: string; customerPhone: string; customerEmail: string;
  faultDescription: string; appearance: string; remarks: string; serviceType: string;
  repairType: string; faultLevel: string; status: string; receivedAt: string;
  doneAt: string | null; deliveredAt: string | null; startedAt: string | null; completedAt: string | null;
  bounceCount: number; isBounce: boolean; lastReminderAt: string | null; slaDeadline: string | null;
  subtotal: number; quotationItems: number; discount: number; total: number;
  collected: number; quotationRemarks: string | null; createdAt: string; taxRate: number;
  creator: { name: string }; assignee: { id: string; name: string } | null;
  parts: { id: string; quantity: number; unitPrice: number; total: number; sparePart: { name: string; partNumber: string } }[];
  lineItems: LineItem[];
  logs: { id: string; action: string; description: string; createdAt: string; user: { name: string } }[];
  attachments: Attachment[]; bounces: Bounce[]; notes: Note[];
  tatDays: number; isOverdue: boolean; customerOrderCount: number; customerFirstVisit: string;
  rating?: { rating: number; comment: string | null } | null;
  payments: Payment[];
  checklist: CheckItem[];
  shop: { name: string; logoUrl: string | null; whatsappPhone?: string | null };
};

type Engineer = { id: string; name: string };
type SparePart = { id: string; name: string; partNumber: string; unitPrice: number; stock: number };

const STATUS_OPTIONS = ["RECEIVED", "DIAGNOSING", "REPAIRING", "DONE", "DELIVERED", "CANCELLED"];
const STATUS_COLORS: Record<string, string> = {
  RECEIVED: "bg-blue-500/20 text-blue-600 dark:text-blue-400", DIAGNOSING: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  REPAIRING: "bg-orange-500/20 text-orange-600 dark:text-orange-400", DONE: "bg-green-500/20 text-green-600 dark:text-green-400",
  DELIVERED: "bg-slate-500/20 text-slate-500", CANCELLED: "bg-red-500/20 text-red-600 dark:text-red-400",
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

const INPUT = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500";
const INPUT_INNER = "w-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none";
const INPUT_INNER_FOCUS_GREEN = "w-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-green-500";

export default function WorkOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const currency = user?.shop?.currency ?? "MAD";
  const fmt = (n: number) => formatCurrency(n, currency);
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
  const [photoView, setPhotoView] = useState<"grid" | "timeline">("grid");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [deleteError, setDeleteError] = useState("");
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
  const [elapsed, setElapsed] = useState(0);
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [slaCountdown, setSlaCountdown] = useState("");
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [bounceTouched, setBounceTouched] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // AI Repair Assistant
  type AiResult = {
    likelyCause: string;
    repairSteps: string[];
    partsNeeded: { name: string; quantity: number; note?: string }[];
    estimatedTime: string;
    successRate: string;
    commonMistakes: string[];
    suggestedPrice: { min: number; max: number };
    difficulty: string;
  };
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiAddingNote, setAiAddingNote] = useState(false);
  const [aiAddingParts, setAiAddingParts] = useState(false);
  const [showSocialShare, setShowSocialShare] = useState(false);

  // Price suggestion
  type PriceSuggestion = {
    suggestedMin: number; suggestedMax: number; marketAverage: number;
    reasoning: string; confidence: "HIGH" | "MEDIUM" | "LOW"; currency: string;
  };
  const [priceSuggestion, setPriceSuggestion] = useState<PriceSuggestion | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [showPricePopover, setShowPricePopover] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowAiPanel(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Scrolls a focused input into view above the mobile keyboard.
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target;
    setTimeout(() => { target.scrollIntoView({ behavior: "smooth", block: "center" }); }, 300);
  };

  useEffect(() => {
    if (!order?.slaDeadline || ["DELIVERED", "CANCELLED"].includes(order.status)) return;
    function updateCountdown() {
      const diffMs = new Date(order!.slaDeadline!).getTime() - Date.now();
      if (diffMs <= 0) { setSlaCountdown("BREACHED"); return; }
      const h = Math.floor(diffMs / (1000 * 60 * 60));
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diffMs % (1000 * 60)) / 1000);
      setSlaCountdown(`${h}h ${m}m ${s}s`);
    }
    updateCountdown();
    const id = setInterval(updateCountdown, 1000);
    return () => clearInterval(id);
  }, [order?.slaDeadline, order?.status]);

  useEffect(() => {
    window.scrollTo(0, 0);
    load();
    loadMessages();
    fetch("/api/users", { credentials: "include" }).then(r => r.json()).then(setEngineers).catch(() => {});
    fetch("/api/spareparts", { credentials: "include" }).then(r => r.json()).then(setSpareParts).catch(() => {});
  }, []);

  useEffect(() => {
    if (!order?.startedAt || order?.completedAt) return;
    const tick = () => setElapsed(Date.now() - new Date(order.startedAt!).getTime());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [order?.startedAt, order?.completedAt]);

  useEffect(() => {
    const pollId = setInterval(loadMessages, 3000);
    return () => clearInterval(pollId);
  }, []);

  async function loadMessages() {
    const res = await fetch(`/api/workorders/${params.id}/messages`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;
    setSendingMessage(true);
    await fetch(`/api/workorders/${params.id}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ message: newMessage }),
    });
    setNewMessage("");
    await loadMessages();
    setSendingMessage(false);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function sendReminder() {
    setSendingReminder(true);
    const res = await fetch(`/api/workorders/${params.id}/remind`, { method: "POST", credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setOrder(prev => prev ? { ...prev, lastReminderAt: data.lastReminderAt } : prev);
    }
    setSendingReminder(false);
  }

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
    setDeleteError("");
    const res = await fetch(`/api/workorders/${params.id}/edit`, { method: "DELETE", credentials: "include" });
    if (res.ok) { router.push("/dashboard"); }
    else {
      const d = await res.json().catch(() => ({}));
      setDeleteError(d.error || "Failed to delete. Try again.");
      setDeletingOrder(false);
    }
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
    if (!bounceReason || !bounceScenario) { setBounceTouched(true); return; }
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

  async function runAiAssist() {
    setShowAiPanel(true);
    setAiLoading(true);
    setAiResult(null);
    setAiError(null);
    try {
      const res = await fetch(`/api/workorders/${params.id}/ai-assist`, {
        method: "POST", credentials: "include",
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiResult(data);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI service error");
    } finally {
      setAiLoading(false);
    }
  }

  async function aiAddToNotes() {
    if (!aiResult) return;
    setAiAddingNote(true);
    const text = [
      `🤖 AI Repair Analysis — ${order!.deviceBrand} ${order!.deviceModel}`,
      `Likely cause: ${aiResult.likelyCause}`,
      `Difficulty: ${aiResult.difficulty} | Time: ${aiResult.estimatedTime} | Success rate: ${aiResult.successRate}`,
      `Steps: ${aiResult.repairSteps.map((s, i) => `${i + 1}. ${s}`).join(" ")}`,
      aiResult.commonMistakes.length ? `Watch out: ${aiResult.commonMistakes.join("; ")}` : "",
      `Suggested price: ${aiResult.suggestedPrice.min}–${aiResult.suggestedPrice.max} ${currency}`,
    ].filter(Boolean).join("\n");
    await fetch(`/api/workorders/${params.id}/notes`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ message: text }),
    });
    await load();
    setAiAddingNote(false);
  }

  async function aiAddParts() {
    if (!aiResult || !aiResult.partsNeeded.length) return;
    setAiAddingParts(true);
    for (const part of aiResult.partsNeeded) {
      const match = spareParts.find(sp =>
        sp.name.toLowerCase().includes(part.name.toLowerCase()) ||
        part.name.toLowerCase().includes(sp.name.toLowerCase())
      );
      if (match) {
        await fetch(`/api/workorders/${params.id}/parts`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          credentials: "include", body: JSON.stringify({ sparePartId: match.id, quantity: part.quantity }),
        });
      }
    }
    await load();
    setAiAddingParts(false);
  }

  async function fetchPriceSuggestion() {
    setLoadingPrice(true);
    setPriceError(null);
    setPriceSuggestion(null);
    setShowPricePopover(true);
    try {
      const res = await fetch(`/api/workorders/${params.id}/price-suggestion`, {
        method: "POST", credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setPriceSuggestion(data);
    } catch (e: unknown) {
      setPriceError(e instanceof Error ? e.message : "Failed to get price suggestion");
    } finally {
      setLoadingPrice(false);
    }
  }

  function applyPriceSuggestion(price: number) {
    setManualTotal(String(Math.round(price)));
    setEditingQuotation(true);
    setShowPricePopover(false);
    setPriceSuggestion(null);
  }

  async function deleteAttachment(attachmentId: string) {
    setDeletingAttachmentId(attachmentId);
    await fetch(`/api/workorders/${params.id}/attachments`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ attachmentId }),
    });
    setDeletingAttachmentId(null); await load();
  }

  if (loading) return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <style>{`@keyframes skeleton-pulse { 0% { opacity: 0.4 } 50% { opacity: 0.8 } 100% { opacity: 0.4 } }`}</style>
      <div className="flex items-center gap-3" style={{ animation: "skeleton-pulse 1.5s ease-in-out infinite" }}>
        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3"
              style={{ animation: "skeleton-pulse 1.5s ease-in-out infinite" }}>
              <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...Array(4)].map((_, j) => <div key={j} className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />)}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 h-32"
              style={{ animation: "skeleton-pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      </div>
    </div>
  );
  if (!order) return null;

  const selectedPartData = spareParts.find(p => p.id === selectedPart);
  const customerTier = loyaltyTier(order.customerOrderCount);
  const customerSinceMonths = (() => {
    const d = new Date(order.customerFirstVisit);
    const n = new Date();
    return (n.getFullYear() - d.getFullYear()) * 12 + (n.getMonth() - d.getMonth());
  })();
  const grandTotal = order.subtotal + order.quotationItems - order.discount;
  const taxAmount = grandTotal * (order.taxRate ?? 0) / 100;
  const totalWithTax = grandTotal + taxAmount;
  const remaining = totalWithTax - order.collected;
  const isFullyPaid = remaining <= 0.01 && order.collected > 0 && order.collected <= totalWithTax + 0.01;
  const checkOK = order.checklist.filter(c => c.status === "OK").length;
  const checkIssue = order.checklist.filter(c => c.status === "ISSUE").length;
  const checkNA = order.checklist.filter(c => c.status === "NA").length;
  const checkPending = order.checklist.filter(c => c.status === "PENDING").length;

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm">← Back</button>
          <h1 className="text-slate-900 dark:text-white font-bold">
            {order.orderNumber.startsWith("wo-")
              ? order.orderNumber.toUpperCase()
              : `WO-${new Date(order.createdAt).getFullYear()}-${order.orderNumber.slice(0, 6).toUpperCase()}`}
          </h1>
          {order.isBounce && <span className="text-xs bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">Bounce ×{order.bounceCount}</span>}
          {order.isOverdue && <span className="text-xs bg-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">⚠ Overdue {order.tatDays}d</span>}
          <span className="text-xs text-slate-500">TAT: {order.tatDays} day{order.tatDays !== 1 ? "s" : ""}</span>
          {order.slaDeadline && !["DELIVERED", "CANCELLED"].includes(order.status) && (
            slaCountdown === "BREACHED"
              ? <span className="text-xs bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">🔴 SLA Breached</span>
              : <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${slaCountdown && new Date(order.slaDeadline).getTime() - Date.now() < 2 * 60 * 60 * 1000 ? "bg-orange-500/20 text-orange-600 dark:text-orange-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"}`}>
                  ⏱ SLA: {slaCountdown || "..."}
                </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a href={`/print/${params.id}`} target="_blank" className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">🖨 Print</a>
          {order.status === "DELIVERED" && order.attachments.some(a => a.tag === "intake") && order.attachments.some(a => a.tag === "completion") && (
            <button onClick={() => setShowSocialShare(true)} className="text-xs px-3 py-1.5 bg-pink-600/20 hover:bg-pink-600/35 text-pink-600 dark:text-pink-400 rounded-lg transition-colors font-medium">📱 Share</button>
          )}
          {order.customerPhone && (() => {
            const trackingLink = `${APP_URL}/track/${order.orderNumber.slice(0, 6)}`;
            const msg = fillTemplate(DEFAULT_TEMPLATES.statusUpdate, {
              customerName: order.customerName,
              deviceBrand: order.deviceBrand,
              deviceModel: order.deviceModel,
              status: statusLabel(order.status),
              trackingLink,
            });
            return (
              <a href={buildWaUrl(order.customerPhone, msg)} target="_blank" rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 bg-green-600/20 hover:bg-green-600/35 text-green-700 dark:text-green-400 rounded-lg transition-colors font-medium">
                💬 WhatsApp
              </a>
            );
          })()}
          <div className="flex items-center gap-1.5">
            <button onClick={sendReminder} disabled={sendingReminder} className="text-xs px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/35 text-amber-700 dark:text-amber-400 rounded-lg transition-colors disabled:opacity-50">
              {sendingReminder ? "..." : "🔔 Send Reminder"}
            </button>
            {order.lastReminderAt && (
              <span className="text-xs text-slate-400">Last: {new Date(order.lastReminderAt).toLocaleDateString()}</span>
            )}
          </div>
          {(order.status === "DONE" || order.status === "DELIVERED") && (
            <a href={`/dashboard/workorders/${params.id}/health-report`} target="_blank" className="text-xs px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-700 dark:text-emerald-400 rounded-lg transition-colors font-medium">🩺 Health Report</a>
          )}
          <button onClick={() => router.push(`/dashboard/workorders/${params.id}/edit`)} className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">✏️ Edit</button>
          <button onClick={() => setShowBounceForm(!showBounceForm)} className="text-xs px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 text-red-600 dark:text-red-400 rounded-lg transition-colors">Report Bounce</button>
          {isAdmin && !showDeleteConfirm && <button onClick={() => setShowDeleteConfirm(true)} className="text-xs px-3 py-1.5 bg-red-700/40 hover:bg-red-700/70 text-red-600 dark:text-red-400 rounded-lg transition-colors">🗑 Delete</button>}
          {isAdmin && showDeleteConfirm && (
            <div className="flex items-center gap-2 flex-wrap">
              {deleteError
                ? <span className="text-xs text-red-500">{deleteError}</span>
                : <span className="text-xs text-red-600 dark:text-red-400">Delete?</span>}
              <button onClick={deleteOrder} disabled={deletingOrder} className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg disabled:opacity-50">{deletingOrder ? "..." : "Yes"}</button>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteError(""); }} className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">No</button>
            </div>
          )}
          {order.status === "RECEIVED" && (
            <button onClick={() => setPendingStatus("DIAGNOSING")} className="text-xs px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-colors font-medium">
              → Start Diagnosis
            </button>
          )}
          {order.status === "DIAGNOSING" && (
            <button onClick={() => setPendingStatus("REPAIRING")} className="text-xs px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors font-medium">
              → Start Repair
            </button>
          )}
          {order.status === "REPAIRING" && (
            <button onClick={() => setPendingStatus("DONE")} className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium">
              → Mark Done
            </button>
          )}
          {order.status === "DONE" && (
            <button onClick={() => setPendingStatus("DELIVERED")} className="text-xs px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors font-medium">
              → Mark Delivered
            </button>
          )}
          <select className={`text-xs px-3 py-1.5 rounded-full font-medium border-0 focus:outline-none cursor-pointer ${STATUS_COLORS[order.status] ?? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}
            value={order.status} onChange={(e) => changeStatus(e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Bounce form */}
      {showBounceForm && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800/50 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Report Bounce Repair</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Scenario</label>
              <select className={INPUT} value={bounceScenario} onChange={(e) => setBounceScenario(e.target.value)}>
                <option value="">Select...</option>
                {BOUNCE_SCENARIOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {bounceTouched && !bounceScenario && <p style={{ color: "#ef4444", fontSize: 11 }}>Required</p>}
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Reason</label>
              <input className={INPUT} placeholder="Describe..." value={bounceReason} onChange={(e) => setBounceReason(e.target.value)} />
              {bounceTouched && !bounceReason && <p style={{ color: "#ef4444", fontSize: 11 }}>Required</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submitBounce} disabled={submittingBounce}
              style={(!bounceReason || !bounceScenario) ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg">{submittingBounce ? "..." : "Submit"}</button>
            <button onClick={() => setShowBounceForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {/* SLA banner */}
      {order.slaDeadline && !["DELIVERED", "CANCELLED"].includes(order.status) && (
        <div className={`rounded-xl px-4 py-3 flex items-center justify-between gap-4 ${slaCountdown === "BREACHED" ? "bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800/50" : "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40"}`}>
          <div className="flex items-center gap-3">
            <span className="text-lg">{slaCountdown === "BREACHED" ? "🔴" : "⏱"}</span>
            <div>
              <p className={`text-xs font-semibold ${slaCountdown === "BREACHED" ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}`}>
                {slaCountdown === "BREACHED" ? "SLA Deadline Breached" : "SLA Deadline"}
              </p>
              <p className="text-xs text-slate-500">{new Date(order.slaDeadline).toLocaleString()}</p>
            </div>
          </div>
          {slaCountdown && slaCountdown !== "BREACHED" && (
            <span className={`text-sm font-mono font-bold ${new Date(order.slaDeadline).getTime() - Date.now() < 2 * 60 * 60 * 1000 ? "text-orange-600 dark:text-orange-400" : "text-blue-600 dark:text-blue-400"}`}>
              {slaCountdown}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">

          {/* Device info */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Device Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Info label="Brand" value={order.deviceBrand} />
              <Info label="Model" value={order.deviceModel} />
              <Info label="Serial Number" value={order.serialNumber || "—"} />
              <Info label="IMEI" value={order.imei || "—"} />
              <Info label="Warranty Start" value={order.warrantyStart ? new Date(order.warrantyStart).toLocaleDateString() : "—"} />
              <Info label="Warranty End" value={order.warrantyEnd ? new Date(order.warrantyEnd).toLocaleDateString() : "—"} />
            </div>
          </section>

          {/* Customer info */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Name</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-slate-900 dark:text-white">{order.customerName}</span>
                  {customerTier && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${customerTier.className}`}>
                      {customerTier.label}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{order.customerOrderCount} order{order.customerOrderCount !== 1 ? "s" : ""}</span>
                  {customerSinceMonths > 0 && (
                    <span className="text-xs text-purple-500 dark:text-purple-400">
                      · Customer since {customerSinceMonths < 12
                        ? `${customerSinceMonths}mo`
                        : `${Math.floor(customerSinceMonths / 12)}y${customerSinceMonths % 12 > 0 ? ` ${customerSinceMonths % 12}mo` : ""}`}
                    </span>
                  )}
                </div>
              </div>
              <Info label="Phone" value={order.customerPhone} />
              <Info label="Email" value={order.customerEmail || "—"} />
            </div>
          </section>

          {/* Fault & service */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Fault & Service</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-3">
              <Info label="Service Type" value={order.serviceType} />
              <Info label="Repair Type" value={order.repairType || "—"} />
              <Info label="Fault Level" value={order.faultLevel} />
              <Info label="Appearance" value={order.appearance || "—"} />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Fault Description</p>
              <p className="text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 rounded-lg p-3">{order.faultDescription}</p>
            </div>
            {order.remarks && (
              <div className="space-y-2 mt-3">
                <p className="text-xs text-slate-500">Remarks</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg p-3">{order.remarks}</p>
              </div>
            )}
          </section>

          {/* Spare parts */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Spare Parts</h2>
              <button onClick={() => setShowPartForm(!showPartForm)} className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">+ Add Part</button>
            </div>
            {showPartForm && (
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Part</label>
                    <select className={INPUT_INNER + " focus:outline-none"} value={selectedPart} onChange={(e) => setSelectedPart(e.target.value)}>
                      <option value="">Select part...</option>
                      {spareParts.map(p => <option key={p.id} value={p.id}>{p.name} — {p.unitPrice.toFixed(2)} (stock: {p.stock})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Quantity</label>
                    <input type="number" min="1" className={INPUT_INNER} value={partQty} onChange={(e) => setPartQty(e.target.value)} />
                  </div>
                </div>
                {selectedPartData && <p className="text-xs text-slate-500">Total: <span className="text-slate-900 dark:text-white font-medium">{(selectedPartData.unitPrice * parseInt(partQty || "1")).toFixed(2)}</span></p>}
                <div className="flex gap-2">
                  <button onClick={addPart} disabled={addingPart || !selectedPart} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg">{addingPart ? "Adding..." : "Add"}</button>
                  <button onClick={() => setShowPartForm(false)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg">Cancel</button>
                </div>
              </div>
            )}
            {order.parts.length === 0 ? <p className="text-sm text-slate-500">No parts added yet.</p> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left pb-2 text-xs text-slate-500">Part</th>
                  <th className="text-left pb-2 text-xs text-slate-500">Part #</th>
                  <th className="text-right pb-2 text-xs text-slate-500">Qty</th>
                  <th className="text-right pb-2 text-xs text-slate-500">Price</th>
                  <th className="text-right pb-2 text-xs text-slate-500">Total</th>
                </tr></thead>
                <tbody>
                  {order.parts.map(p => (
                    <tr key={p.id} className="border-b border-slate-200/50 dark:border-slate-800/50">
                      <td className="py-2 text-slate-900 dark:text-white">{p.sparePart.name}</td>
                      <td className="py-2 text-slate-400 font-mono text-xs">{p.sparePart.partNumber || "—"}</td>
                      <td className="py-2 text-right text-slate-600 dark:text-slate-300">{p.quantity}</td>
                      <td className="py-2 text-right text-slate-600 dark:text-slate-300">{p.unitPrice.toFixed(2)}</td>
                      <td className="py-2 text-right text-slate-900 dark:text-white font-medium">{p.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Attachments */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Attachments</h2>
              <div className="flex items-center gap-2 ml-auto">
                {order.attachments.length > 0 && (
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                    <button onClick={() => setPhotoView("grid")}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${photoView === "grid" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
                      Grid
                    </button>
                    <button onClick={() => setPhotoView("timeline")}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${photoView === "timeline" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
                      Timeline
                    </button>
                  </div>
                )}
                <button onClick={() => fileRef.current?.click()} disabled={uploadingFile || !!pendingFile} className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors">{uploadingFile ? "Uploading..." : "Upload File"}</button>
                <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.txt" onChange={onFileSelected} />
              </div>
            </div>
            {pendingFile && (
              <div className="mb-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700/50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">{pendingFile.name}</p>
                  <p className="text-xs text-slate-500">{(pendingFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Photo stage</label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { key: "intake", icon: "📥", label: "Intake" },
                      { key: "repair", icon: "🔧", label: "Repair" },
                      { key: "completion", icon: "✅", label: "Done" },
                      { key: "other", icon: "📄", label: "Other" },
                    ].map(t => (
                      <button key={t.key} onClick={() => setUploadTag(t.key)}
                        className={`py-1.5 rounded-lg text-xs font-medium transition-colors flex flex-col items-center gap-0.5 ${uploadTag === t.key ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600"}`}>
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={confirmUpload} disabled={uploadingFile} className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg disabled:opacity-50">{uploadingFile ? "Uploading..." : "Confirm Upload"}</button>
                  <button onClick={cancelUpload} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg">Cancel</button>
                </div>
              </div>
            )}
            {order.attachments.length === 0 ? (
              <p className="text-sm text-slate-500">No attachments yet.</p>
            ) : photoView === "grid" ? (
              <div className="grid grid-cols-3 gap-3">
                {order.attachments.map(a => (
                  <div key={a.id} className="bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden group relative">
                    {a.path.startsWith("data:image") || a.path.startsWith("https://") ? (
                      <img src={a.path} alt={a.filename} onClick={() => setLightboxUrl(a.path)}
                        className="w-full h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                    ) : (
                      <div className="h-24 flex items-center justify-center text-slate-500 text-xs">📄 {a.filename}</div>
                    )}
                    <div className="px-2 py-1 flex items-center justify-between gap-1">
                      <p className="text-xs text-slate-500 truncate">{a.filename}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                        a.tag === "intake" ? "bg-blue-500/20 text-blue-600 dark:text-blue-400" :
                        a.tag === "repair" ? "bg-orange-500/20 text-orange-600 dark:text-orange-400" :
                        a.tag === "completion" ? "bg-green-500/20 text-green-600 dark:text-green-400" :
                        "bg-slate-200 dark:bg-slate-700 text-slate-500"
                      }`}>
                        {a.tag === "intake" ? "📥" : a.tag === "repair" ? "🔧" : a.tag === "completion" ? "✅" : "📄"}
                      </span>
                    </div>
                    <button onClick={() => { if (confirm(`Delete "${a.filename}"?`)) deleteAttachment(a.id); }} disabled={deletingAttachmentId === a.id}
                      className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50">×</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {[
                  { key: "intake",     icon: "📥", label: "Intake",     pill: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
                  { key: "repair",     icon: "🔧", label: "Repair",     pill: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
                  { key: "completion", icon: "✅", label: "Completion", pill: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
                  { key: "other",      icon: "📄", label: "Other",      pill: "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700" },
                ].map(stage => {
                  const photos = order.attachments.filter(a =>
                    a.tag === stage.key && (a.path.startsWith("data:image") || a.path.startsWith("https://"))
                  );
                  if (photos.length === 0) return null;
                  const stageDate = new Date(photos[0].createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
                  return (
                    <div key={stage.key}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${stage.pill}`}>
                          {stage.icon} {stage.label}
                        </span>
                        <span className="text-xs text-slate-400">{stageDate}</span>
                        <span className="text-xs text-slate-400">· {photos.length} photo{photos.length !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {photos.map(a => (
                          <img key={a.id} src={a.path} alt={a.filename} onClick={() => setLightboxUrl(a.path)}
                            className="h-36 w-36 object-cover rounded-xl flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity ring-2 ring-transparent hover:ring-blue-500" />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Diagnosis Checklist */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Diagnosis Checklist</h2>
                {order.checklist.length > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">{order.checklist.filter(c => c.status !== "PENDING").length}/{order.checklist.length} checked</p>
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
                        { s: "OK", icon: "✓", title: "OK", active: "bg-green-600 text-white", inactive: "bg-slate-200 dark:bg-slate-800 text-slate-400 hover:bg-green-100 dark:hover:bg-green-900 hover:text-green-600 dark:hover:text-green-400" },
                        { s: "ISSUE", icon: "!", title: "Issue", active: "bg-red-600 text-white", inactive: "bg-slate-200 dark:bg-slate-800 text-slate-400 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400" },
                        { s: "NA", icon: "—", title: "N/A", active: "bg-slate-600 text-white", inactive: "bg-slate-200 dark:bg-slate-800 text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700" },
                        { s: "PENDING", icon: "○", title: "Pending", active: "bg-slate-400 dark:bg-slate-700 text-slate-900 dark:text-slate-400", inactive: "bg-slate-200 dark:bg-slate-800 text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700" },
                      ].map(btn => (
                        <button key={btn.s} onClick={() => updateCheck(check.id, btn.s)} title={btn.title}
                          className={`w-6 h-6 rounded text-xs font-bold transition-all ${check.status === btn.s ? btn.active : btn.inactive}`}>
                          {btn.icon}
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                      <p className={`text-xs mt-1 ${
                        check.status === "OK" ? "text-green-600 dark:text-green-400" :
                        check.status === "ISSUE" ? "text-red-600 dark:text-red-400" :
                        check.status === "NA" ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-300"
                      }`}>{check.item}</p>
                      <button onClick={() => deleteCheckItem(check.id)} className="text-slate-300 dark:text-slate-700 hover:text-red-500 dark:hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">×</button>
                    </div>
                  </div>
                ))}
                {order.checklist.length > 0 && (
                  <div className="pt-3 mt-1 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex gap-3 text-xs mb-2">
                      <span className="text-green-600 dark:text-green-400">✓ {checkOK} OK</span>
                      <span className="text-red-600 dark:text-red-400">! {checkIssue} Issues</span>
                      <span className="text-slate-500">— {checkNA} N/A</span>
                      <span className="text-slate-400">○ {checkPending} Pending</span>
                    </div>
                    <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                      <div className="bg-green-500 h-full transition-all" style={{ width: `${(checkOK / order.checklist.length) * 100}%` }} />
                      <div className="bg-red-500 h-full transition-all" style={{ width: `${(checkIssue / order.checklist.length) * 100}%` }} />
                      <div className="bg-slate-400 dark:bg-slate-600 h-full transition-all" style={{ width: `${(checkNA / order.checklist.length) * 100}%` }} />
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <input className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="Add custom check item..." value={newCheckItem}
                    onChange={e => setNewCheckItem(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addCheckItem(); }} />
                  <button onClick={addCheckItem} disabled={addingCheck || !newCheckItem.trim()}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition-colors">
                    {addingCheck ? "..." : "+ Add"}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Customer Messages */}
          {(() => {
            const unreadFromCustomer = messages.filter(m => m.senderType === "CUSTOMER" && !m.read).length;
            return (
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm flex-shrink-0">👤</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">Customer Messages</p>
                      {unreadFromCustomer > 0 && (
                        <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                          {unreadFromCustomer} new
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{order.customerName} · {order.customerPhone}</p>
                  </div>
                  {messages.length > 0 && <span className="text-xs text-slate-400 flex-shrink-0">{messages.length} total</span>}
                </div>

                {/* Messages */}
                <div className="h-80 overflow-y-auto flex flex-col gap-1.5 px-4 py-4 bg-slate-50 dark:bg-[#0d1117]">
                  {messages.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
                      <span className="text-2xl">💬</span>
                      <p className="text-xs text-slate-400">No messages yet.</p>
                      <p className="text-xs text-slate-500">Send a message to the customer below.</p>
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const isShop = msg.senderType === "SHOP";
                    const time = new Date(msg.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
                    const prevSame = i > 0 && messages[i - 1].senderType === msg.senderType;
                    const isUnreadCustomer = !isShop && !msg.read;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isShop ? "items-end" : "items-start"} ${prevSame ? "mt-0.5" : "mt-3"}`}>
                        {!prevSame && (
                          <span className={`text-[10px] font-semibold mb-1 px-1 ${isShop ? "text-blue-500 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}>
                            {isShop ? "You" : "Customer"}
                          </span>
                        )}
                        <div className={`max-w-[72%] px-3.5 py-2 text-sm leading-relaxed break-words shadow-sm ${
                          isShop
                            ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm"
                            : isUnreadCustomer
                              ? "bg-blue-50 dark:bg-blue-950/40 text-slate-900 dark:text-white border border-blue-300 dark:border-blue-700 rounded-2xl rounded-tl-sm"
                              : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm"
                        }`}>
                          {msg.message}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 px-1">
                          <span className="text-[9px] text-slate-400">{time}</span>
                          {isShop && (
                            <span className={`text-[10px] font-medium ${msg.read ? "text-blue-500 dark:text-blue-400" : "text-slate-400"}`}>
                              {msg.read ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-3 py-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900">
                  <input
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 rounded-full px-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors"
                    placeholder="Message customer..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all text-white disabled:opacity-30 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-500 active:scale-95"
                  >
                    {sendingMessage ? (
                      <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 translate-x-px" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    )}
                  </button>
                </div>
              </section>
            );
          })()}

          {/* Bounce history */}
          {order.bounces.length > 0 && (
            <section className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-4">Bounce History ({order.bounces.length})</h2>
              <div className="space-y-3">
                {order.bounces.map((b, i) => (
                  <div key={b.id} className="text-xs border-b border-red-200 dark:border-red-800/20 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-red-600 dark:text-red-400 font-medium">Bounce #{i + 1} — {b.scenario.replace(/_/g, " ")}</span>
                      <span className="text-slate-400">{new Date(b.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-500 mt-0.5">{b.reason}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <section className={`border rounded-xl p-5 ${order.isOverdue ? "bg-orange-50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800/30" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"}`}>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Turnaround Time</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Received</span><span className="text-slate-900 dark:text-white">{new Date(order.receivedAt).toLocaleDateString()}</span></div>
              {order.doneAt && <div className="flex justify-between"><span className="text-slate-500">Done</span><span className="text-slate-900 dark:text-white">{new Date(order.doneAt).toLocaleDateString()}</span></div>}
              {order.deliveredAt && <div className="flex justify-between"><span className="text-slate-500">Delivered</span><span className="text-slate-900 dark:text-white">{new Date(order.deliveredAt).toLocaleDateString()}</span></div>}
              <div className={`flex justify-between font-semibold border-t border-slate-200 dark:border-slate-700 pt-2 mt-2 ${order.isOverdue ? "text-orange-600 dark:text-orange-400" : "text-slate-900 dark:text-white"}`}>
                <span>Total TAT</span><span>{order.tatDays} day{order.tatDays !== 1 ? "s" : ""} {order.isOverdue ? "⚠️" : ""}</span>
              </div>
            </div>
          </section>

          {/* Repair Timer */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Repair Timer</h2>
            {order.startedAt && order.completedAt ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Started</span>
                  <span className="text-slate-900 dark:text-white">{new Date(order.startedAt).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Completed</span>
                  <span className="text-slate-900 dark:text-white">{new Date(order.completedAt).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-slate-200 dark:border-slate-700 pt-2 mt-1 text-emerald-600 dark:text-emerald-400">
                  <span>Duration</span>
                  <span>{formatRepairDuration(new Date(order.completedAt).getTime() - new Date(order.startedAt).getTime())}</span>
                </div>
              </div>
            ) : order.startedAt ? (
              <div className="text-center py-2 space-y-1">
                <p className="text-2xl font-mono font-bold text-orange-500 dark:text-orange-400 tabular-nums">{formatRepairDuration(elapsed)}</p>
                <p className="text-xs text-slate-500">repair in progress</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 leading-relaxed">
                Starts automatically when status changes to{" "}
                <span className="text-orange-500 dark:text-orange-400 font-medium">REPAIRING</span>, stops when{" "}
                <span className="text-green-600 dark:text-green-400 font-medium">DONE</span>.
              </p>
            )}
          </section>

          {order.status === "DELIVERED" && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Customer Rating</h2>
              {order.rating ? (
                <div>
                  <div className="text-yellow-500 dark:text-yellow-400 text-xl mb-1">{"★".repeat(order.rating.rating)}<span className="text-slate-300 dark:text-slate-600">{"★".repeat(5 - order.rating.rating)}</span></div>
                  {order.rating.comment && <p className="text-xs text-slate-500 italic">"{order.rating.comment}"</p>}
                </div>
              ) : (
                <div>
                  <p className="text-xs text-slate-500 mb-2">No rating yet.</p>
                  <button onClick={() => setShowRating(true)} className="text-xs px-3 py-1.5 bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-600 dark:text-yellow-400 rounded-lg transition-colors">★ Collect Rating</button>
                </div>
              )}
            </section>
          )}

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Assigned Engineer</h2>
            <select className={INPUT} value={order.assignee?.id ?? ""} onChange={(e) => assignEngineer(e.target.value)}>
              <option value="">Unassigned</option>
              {engineers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quotation</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchPriceSuggestion}
                  disabled={loadingPrice}
                  className="text-xs px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loadingPrice ? <span className="w-3 h-3 border-2 border-amber-400/40 border-t-amber-500 rounded-full animate-spin inline-block" /> : "💡"}
                  {loadingPrice ? "Thinking…" : "Price Suggestion"}
                </button>
                <button onClick={() => setEditingQuotation(!editingQuotation)} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">{editingQuotation ? "Cancel" : "Edit"}</button>
              </div>
            </div>

            {/* Price suggestion popover */}
            {showPricePopover && (
              <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-amber-200 dark:border-amber-800/40 bg-amber-100/60 dark:bg-amber-900/20">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">💡</span>
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">AI Price Suggestion</span>
                  </div>
                  <button onClick={() => { setShowPricePopover(false); setPriceSuggestion(null); setPriceError(null); }}
                    className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 text-sm font-bold w-5 h-5 flex items-center justify-center rounded transition-colors">×</button>
                </div>

                {loadingPrice && (
                  <div className="flex items-center gap-3 px-3 py-4">
                    <div className="w-5 h-5 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin flex-shrink-0" />
                    <p className="text-xs text-amber-600 dark:text-amber-400">Analyzing market rates for this repair…</p>
                  </div>
                )}

                {priceError && !loadingPrice && (
                  <div className="px-3 py-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-red-600 dark:text-red-400">{priceError}</p>
                    <button onClick={fetchPriceSuggestion} className="text-xs px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg flex-shrink-0">Retry</button>
                  </div>
                )}

                {priceSuggestion && !loadingPrice && (() => {
                  const { suggestedMin, suggestedMax, marketAverage, reasoning, confidence } = priceSuggestion;
                  const midpoint = Math.round((suggestedMin + suggestedMax) / 2);
                  const confidenceStyle = {
                    HIGH:   { cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700", label: "High confidence" },
                    MEDIUM: { cls: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700", label: "Medium confidence" },
                    LOW:    { cls: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700", label: "Low confidence" },
                  }[confidence];

                  return (
                    <div className="p-3 space-y-3">
                      {/* Price range + confidence */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{fmt(suggestedMin)}</span>
                          <span className="text-xs text-amber-500">–</span>
                          <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{fmt(suggestedMax)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Market avg: <span className="font-semibold text-slate-700 dark:text-slate-300">{fmt(marketAverage)}</span></span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${confidenceStyle.cls}`}>
                            {confidence === "HIGH" ? "●" : confidence === "MEDIUM" ? "◐" : "○"} {confidenceStyle.label}
                          </span>
                        </div>
                      </div>

                      {/* Reasoning */}
                      <p className="text-xs text-amber-700/80 dark:text-amber-300/70 leading-relaxed">{reasoning}</p>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <button onClick={() => applyPriceSuggestion(suggestedMin)}
                          className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg transition-colors font-medium">
                          Apply min {fmt(suggestedMin)}
                        </button>
                        <button onClick={() => applyPriceSuggestion(midpoint)}
                          className="text-xs px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors font-medium">
                          Apply midpoint {fmt(midpoint)}
                        </button>
                        <button onClick={() => applyPriceSuggestion(suggestedMax)}
                          className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg transition-colors font-medium">
                          Apply max {fmt(suggestedMax)}
                        </button>
                        <button onClick={() => { setShowPricePopover(false); setPriceSuggestion(null); }}
                          className="text-xs px-3 py-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors ml-auto">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            {grandTotal === 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-300 dark:border-yellow-800/50 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">⚠</span>
                <span className="text-xs text-yellow-700 dark:text-yellow-300">No price set — add a labor fee or service below, or set total manually in Edit</span>
              </div>
            )}
            <div className="space-y-1 mb-3">
              {order.lineItems.map(item => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{item.label}</span>
                  <div className="flex items-center gap-2"><span className="text-slate-900 dark:text-white">{item.amount.toFixed(2)}</span><button onClick={() => deleteLineItem(item.id)} className="text-red-500 dark:text-red-400 hover:text-red-400 dark:hover:text-red-300">×</button></div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mb-3">
              <input className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none" placeholder="e.g. Labor fee, Screen repair..." value={newItemLabel} onChange={(e) => setNewItemLabel(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && newItemLabel && newItemAmount) addLineItem(); }} />
              <input className="w-24 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none" placeholder={`Price ${currency}`} type="number" value={newItemAmount} onChange={(e) => setNewItemAmount(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && newItemLabel && newItemAmount) addLineItem(); }} />
              <button onClick={addLineItem} disabled={addingItem || !newItemLabel || !newItemAmount} className="px-2 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded">+ Add</button>
            </div>
            <p className="text-xs text-slate-400 mb-3">Add labor fees and services above — total updates automatically</p>
            <div className="space-y-1.5 text-sm mb-4">
              {order.subtotal > 0 && <div className="flex justify-between text-slate-500"><span>Parts</span><span>{order.subtotal.toFixed(2)}</span></div>}
              {order.quotationItems > 0 && <div className="flex justify-between text-slate-500"><span>Services</span><span>{order.quotationItems.toFixed(2)}</span></div>}
              {order.discount > 0 && <div className="flex justify-between text-slate-500"><span>Discount</span><span>-{order.discount.toFixed(2)}</span></div>}
              {taxAmount > 0 ? (
                <>
                  <div className="flex justify-between text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-2"><span>Subtotal</span><span>{fmt(grandTotal)}</span></div>
                  <div className="flex justify-between text-slate-500"><span>{`${order.taxRate}% tax`}</span><span>{fmt(taxAmount)}</span></div>
                  <div className="flex justify-between text-slate-900 dark:text-white font-bold border-t border-slate-200 dark:border-slate-700 pt-2"><span>Total incl. tax</span><span>{fmt(totalWithTax)}</span></div>
                </>
              ) : (
                <div className="flex justify-between text-slate-900 dark:text-white font-bold border-t border-slate-200 dark:border-slate-700 pt-2"><span>Total</span><span>{fmt(grandTotal)}</span></div>
              )}
            </div>
            {editingQuotation && (
              <div className="space-y-3 mb-4 bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Total ({currency})</label>
                  <input type="number" min="0" className={INPUT_INNER} value={manualTotal} onChange={(e) => setManualTotal(e.target.value)}
                    placeholder="Set total manually if no parts added" />
                  <p className="text-xs text-slate-400 mt-0.5">Auto-calculated from parts + services when available</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Discount</label>
                  <input type="number" min="0" className={INPUT_INNER} value={discount} onChange={(e) => setDiscount(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Quotation Remarks</label>
                  <textarea rows={2} className={INPUT_INNER + " resize-none"} value={quotationRemarks} onChange={(e) => setQuotationRemarks(e.target.value)} />
                </div>
                <button onClick={saveQuotation} disabled={savingQuotation} className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg">{savingQuotation ? "Saving..." : "Save"}</button>
              </div>
            )}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500 font-medium">Total: {fmt(totalWithTax)}</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">Paid: {fmt(order.collected)}</span>
                  {remaining > 0.01 && <span className="text-red-600 dark:text-red-400 font-medium">Due: {fmt(remaining)}</span>}
                  {isFullyPaid && order.collected <= totalWithTax + 0.01 && <span className="text-green-600 dark:text-green-400 font-medium">✓ Fully paid</span>}
                  {order.collected > totalWithTax + 0.01 && <span className="text-orange-600 dark:text-orange-400 font-medium">⚠ Overpaid {fmt(order.collected - totalWithTax)}</span>}
                  {grandTotal === 0 && <span className="text-yellow-600 dark:text-yellow-400 font-medium">⚠ Add a service fee above</span>}
                </div>
                <button onClick={() => setShowPaymentForm(!showPaymentForm)}
                  className="text-xs px-2.5 py-1 bg-green-600 hover:bg-green-500 text-white rounded-md font-medium transition-colors whitespace-nowrap">
                  + Payment
                </button>
              </div>
              {showPaymentForm && (
                <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 p-3 space-y-3">
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { key: "CASH", icon: "💵", label: "Cash" },
                      { key: "CARD", icon: "💳", label: "Card" },
                      { key: "BANK_TRANSFER", icon: "🏦", label: "Bank" },
                      { key: "OTHER", icon: "💰", label: "Other" },
                    ].map(m => (
                      <button key={m.key} onClick={() => setPaymentMethod(m.key)}
                        className={`py-2 rounded-lg text-xs font-medium transition-colors flex flex-col items-center gap-0.5 ${paymentMethod === m.key ? "bg-green-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600"}`}>
                        <span className="text-base">{m.icon}</span>
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Amount ({currency}) *</label>
                    <input type="number" min="0" placeholder="0.00"
                      className={INPUT_INNER_FOCUS_GREEN}
                      onFocus={handleInputFocus}
                      value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                  </div>
                  {paymentMethod === "CARD" && (
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Last 4 digits</label>
                      <input type="text" maxLength={4} placeholder="1234"
                        className={INPUT_INNER_FOCUS_GREEN + " font-mono"}
                        value={cardLast4} onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ""))} />
                    </div>
                  )}
                  {paymentMethod === "BANK_TRANSFER" && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Bank name</label>
                        <input type="text" placeholder="e.g. CIH, Attijariwafa"
                          className={INPUT_INNER_FOCUS_GREEN}
                          value={bankName} onChange={(e) => setBankName(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Reference number</label>
                        <input type="text" placeholder="REF-XXXXXXXX"
                          className={INPUT_INNER_FOCUS_GREEN + " font-mono"}
                          value={bankRef} onChange={(e) => setBankRef(e.target.value)} />
                      </div>
                    </div>
                  )}
                  {paymentMethod === "OTHER" && (
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Description *</label>
                      <input type="text" placeholder="e.g. Cheque, PayPal"
                        className={INPUT_INNER_FOCUS_GREEN}
                        value={otherDesc} onChange={(e) => setOtherDesc(e.target.value)} />
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Note (optional)</label>
                    <input type="text" placeholder="Any additional note..."
                      className={INPUT_INNER_FOCUS_GREEN}
                      value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={collectPayment} disabled={savingPayment || !paymentAmount || (paymentMethod === "OTHER" && !otherDesc)}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg">
                      {savingPayment ? "Saving..." : "Record Payment"}
                    </button>
                    <button onClick={() => setShowPaymentForm(false)} className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg">Cancel</button>
                  </div>
                </div>
              )}
              {order.payments && order.payments.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700">
                  <div className="px-3 py-2 bg-slate-100/50 dark:bg-slate-800/30">
                    <p className="text-xs text-slate-500 font-medium">Payment history ({order.payments.length})</p>
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {order.payments.map((p) => (
                      <div key={p.id} className="px-3 py-2 flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className="text-base mt-0.5">{METHOD_ICONS[p.method] ?? "💰"}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-900 dark:text-white font-medium">{fmt(p.amount)}</span>
                              <span className="text-xs text-slate-500">{p.method.replace("_", " ")}</span>
                            </div>
                            {p.note && <p className="text-xs text-slate-500 mt-0.5 truncate">{p.note}</p>}
                            <p className="text-xs text-slate-400 mt-0.5">{p.collector.name} · {new Date(p.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {isAdmin && <button onClick={() => deletePayment(p.id)} className="text-red-500 dark:text-red-400 hover:text-red-400 dark:hover:text-red-300 text-xs flex-shrink-0 mt-1">×</button>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Customer Tracking</h2>
            <p className="text-xs text-slate-500 mb-3">Share this link with the customer:</p>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-mono truncate">{typeof window !== "undefined" ? `${window.location.origin}/track/${order.orderNumber.slice(0, 6)}` : ""}</span>
              <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/track/${order.orderNumber.slice(0, 6)}`)} className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex-shrink-0">Copy</button>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Internal Notes</h2>
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {(!order.notes || order.notes.length === 0) && <p className="text-xs text-slate-500">No notes yet.</p>}
              {order.notes?.map(note => (
                <div key={note.id} className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{note.user.name}</span>
                    <span className="text-xs text-slate-400">{new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{note.message}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" placeholder="Add an internal note..." value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addNote(); }} />
              <button onClick={addNote} disabled={addingNote || !newNote.trim()} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg">{addingNote ? "..." : "Add"}</button>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Operation Log</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {order.logs.map(log => {
                const isStatusChange = log.action === "STATUS_CHANGED";
                const isTimerStart = log.action === "TIMER_STARTED";
                const isTimerStop = log.action === "TIMER_STOPPED";
                const newStatus = isStatusChange
                  ? STATUS_OPTIONS.find(s => log.description.includes(s))
                  : null;
                const rowClass = isStatusChange
                  ? "bg-slate-100 dark:bg-slate-800/40 rounded-lg px-3 py-2 border-0"
                  : isTimerStart
                  ? "bg-blue-50 dark:bg-blue-950/20 rounded-lg px-3 py-2 border-0"
                  : isTimerStop
                  ? "bg-emerald-50 dark:bg-emerald-950/20 rounded-lg px-3 py-2 border-0"
                  : "";
                return (
                  <div key={log.id} className={`text-xs border-b border-slate-200/50 dark:border-slate-800/50 pb-2 ${rowClass}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {isStatusChange && newStatus ? (
                          <>
                            <span className="text-slate-500 font-medium">Status →</span>
                            <span className={`px-2 py-0.5 rounded-full font-semibold text-xs ${STATUS_COLORS[newStatus]}`}>
                              {newStatus}
                            </span>
                          </>
                        ) : isTimerStart ? (
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">▶ Timer Started</span>
                        ) : isTimerStop ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            ⏹ Timer Stopped
                            {log.description.includes("·") && (
                              <span className="font-normal text-emerald-600/70 dark:text-emerald-400/70 ml-1.5">
                                · {log.description.split("·")[1]?.trim()}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400 font-medium">{log.action.replace(/_/g, " ")}</span>
                        )}
                      </div>
                      <span className="text-slate-400 font-mono text-xs flex-shrink-0">{new Date(log.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}</span>
                    </div>
                    {!isStatusChange && !isTimerStart && !isTimerStop && (
                      <p className="text-slate-500 mt-0.5">{log.description}</p>
                    )}
                    <p className="text-slate-400 mt-0.5">by {log.user.name}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-xs space-y-2">
            <Info label="Created by" value={order.creator.name} />
            <Info label="Created" value={new Date(order.createdAt).toLocaleString()} />
          </section>
        </div>
      </div>

      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">×</button>
          <img src={lightboxUrl} alt="Full size" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {showRating && (
        <RatingModal workOrderId={order.id} orderNumber={order.orderNumber} customerName={order.customerName}
          onClose={() => setShowRating(false)} onSubmitted={() => { setShowRating(false); load(); }} />
      )}

      {showSocialShare && (() => {
        const intake = order.attachments.find(a => a.tag === "intake");
        const completion = order.attachments.find(a => a.tag === "completion");
        if (!intake || !completion) return null;
        return (
          <SocialShareModal
            deviceBrand={order.deviceBrand}
            deviceModel={order.deviceModel}
            repairType={order.repairType}
            total={order.total}
            currency={currency}
            shopName={order.shop?.name ?? user?.shop?.name ?? ""}
            shopLogoUrl={order.shop?.logoUrl ?? null}
            intakeUrl={intake.path}
            completionUrl={completion.path}
            onClose={() => setShowSocialShare(false)}
          />
        );
      })()}

      {/* Status change confirmation modal */}
      {pendingStatus !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setPendingStatus(null)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Confirm status change</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Change status to {pendingStatus}? This will update the TAT timer.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPendingStatus(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={() => { const s = pendingStatus; setPendingStatus(null); if (s) changeStatus(s); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 50,
            width: 44, height: 44, borderRadius: "50%",
            background: "#2563eb", border: "none", color: "white",
            fontSize: 20, cursor: "pointer", boxShadow: "0 4px 16px rgba(37,99,235,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "opacity 0.2s",
          }}
          aria-label="Back to top"
        >
          ↑
        </button>
      )}

      {/* AI Assist floating button */}
      <button
        onClick={runAiAssist}
        style={{
          position: "fixed", bottom: showBackToTop ? 80 : 24, right: 24, zIndex: 50,
          transition: "bottom 0.2s",
        }}
        className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-full shadow-lg shadow-violet-500/30"
        aria-label="AI Repair Assistant"
      >
        <span>🤖</span>
        <span>AI Assist</span>
      </button>

      {/* AI Repair Assistant slide-in panel */}
      {showAiPanel && (
        <div className="fixed inset-0 z-[60] flex" onClick={() => setShowAiPanel(false)}>
          <div className="flex-1" />
          <div
            className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-violet-600 to-purple-600">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div>
                  <p className="text-white font-semibold text-sm">AI Repair Assistant</p>
                  <p className="text-violet-200 text-xs">{order.deviceBrand} {order.deviceModel}</p>
                </div>
              </div>
              <button onClick={() => setShowAiPanel(false)} className="text-white/70 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">×</button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {aiLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                  <p className="text-sm text-slate-500">Analyzing repair...</p>
                </div>
              )}

              {aiError && !aiLoading && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-1">Analysis failed</p>
                  <p className="text-red-500 dark:text-red-500 text-xs">{aiError}</p>
                  <button onClick={runAiAssist} className="mt-3 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg">Retry</button>
                </div>
              )}

              {aiResult && !aiLoading && (
                <>
                  {/* Likely cause */}
                  <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl p-4">
                    <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide mb-1">Likely Cause</p>
                    <p className="text-sm text-slate-800 dark:text-slate-200">{aiResult.likelyCause}</p>
                  </div>

                  {/* Meta row */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Difficulty", value: aiResult.difficulty, color: aiResult.difficulty === "Easy" ? "text-green-600 dark:text-green-400" : aiResult.difficulty === "Medium" ? "text-yellow-600 dark:text-yellow-400" : aiResult.difficulty === "Hard" ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400" },
                      { label: "Est. Time", value: aiResult.estimatedTime, color: "text-blue-600 dark:text-blue-400" },
                      { label: "Success", value: aiResult.successRate, color: "text-emerald-600 dark:text-emerald-400" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-500 mb-1">{label}</p>
                        <p className={`text-sm font-bold ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Repair steps */}
                  <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Repair Steps</p>
                    <ol className="space-y-2">
                      {aiResult.repairSteps.map((step, i) => (
                        <li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                          <span className="flex-shrink-0 w-5 h-5 bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 rounded-full text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Parts needed */}
                  {aiResult.partsNeeded.length > 0 && (
                    <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Parts Needed</p>
                      <div className="space-y-2">
                        {aiResult.partsNeeded.map((p, i) => {
                          const matched = spareParts.find(sp =>
                            sp.name.toLowerCase().includes(p.name.toLowerCase()) ||
                            p.name.toLowerCase().includes(sp.name.toLowerCase())
                          );
                          return (
                            <div key={i} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${matched ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                                <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{p.name}</span>
                                {p.note && <span className="text-xs text-slate-400 truncate">({p.note})</span>}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs text-slate-500">×{p.quantity}</span>
                                {matched ? (
                                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">In stock</span>
                                ) : (
                                  <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded">Not in inv.</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Suggested price */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">Suggested Price</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{aiResult.suggestedPrice.min}–{aiResult.suggestedPrice.max} <span className="text-sm font-normal text-slate-500">{currency}</span></p>
                  </div>

                  {/* Common mistakes */}
                  {aiResult.commonMistakes.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-2">Watch Out</p>
                      <ul className="space-y-1">
                        {aiResult.commonMistakes.map((m, i) => (
                          <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex gap-2">
                            <span className="text-amber-500 flex-shrink-0">⚠</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer actions */}
            {aiResult && !aiLoading && (
              <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-4 flex gap-2">
                <button
                  onClick={aiAddToNotes}
                  disabled={aiAddingNote}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg disabled:opacity-50 transition-colors"
                >
                  {aiAddingNote ? "Saving..." : "Add to Notes"}
                </button>
                {aiResult.partsNeeded.some(p => spareParts.some(sp =>
                  sp.name.toLowerCase().includes(p.name.toLowerCase()) ||
                  p.name.toLowerCase().includes(sp.name.toLowerCase())
                )) && (
                  <button
                    onClick={aiAddParts}
                    disabled={aiAddingParts}
                    className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {aiAddingParts ? "Adding..." : "Add Parts"}
                  </button>
                )}
                <button
                  onClick={runAiAssist}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 text-xs rounded-lg transition-colors"
                  title="Refresh analysis"
                >
                  ↺
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-slate-900 dark:text-white mt-0.5">{value}</p>
    </div>
  );
}

function formatRepairDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
