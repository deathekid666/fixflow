"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/currency";
import { useLanguage } from "@/context/LanguageContext";

type WorkOrder = {
  id: string; orderNumber: string; deviceBrand: string; deviceModel: string;
  serialNumber: string; imei: string; customerName: string; customerPhone: string;
  customerEmail: string; faultDescription: string; repairType: string;
  status: string; receivedAt: string; doneAt: string | null; deliveredAt: string | null;
  subtotal: number; total: number; discount: number; quotationItems: number; taxRate: number;
  creator: { name: string }; assignee: { id: string; name: string } | null;
  parts: { id: string; quantity: number; unitPrice: number; total: number; sparePart: { name: string; partNumber: string } }[];
  lineItems: { id: string; label: string; amount: number }[];
  checklist: { id: string; item: string; status: string }[];
  shop: { name: string; address: string | null; phone: string | null; email: string | null; logoUrl: string | null; currency?: string } | null;
};

export default function HealthReportPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetch(`/api/workorders/${params.id}`, { credentials: "include" })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setOrder(d); setLoading(false); })
      .catch(() => { setFetchError(true); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="p-6 max-w-3xl mx-auto space-y-4 animate-pulse">
      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-48" />
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
      </div>
    </div>
  );
  if (fetchError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
      <p className="text-lg">{t("failedLoadHealthReport")}</p>
      <button onClick={() => router.back()} className="text-sm text-blue-500 hover:underline">{t("goBack")}</button>
    </div>
  );
  if (!order) return <div className="flex items-center justify-center h-64 text-slate-500">{t("orderNotFound")}</div>;

  const checkOK = order.checklist.filter(c => c.status === "OK");
  const checkIssue = order.checklist.filter(c => c.status === "ISSUE");
  const checkNA = order.checklist.filter(c => c.status === "NA");
  const currency = order.shop?.currency ?? "MAD";
  const fmt = (n: number) => formatCurrency(n, currency);
  const grandTotal = order.subtotal + order.quotationItems - order.discount;
  const taxAmount = grandTotal * (order.taxRate ?? 0) / 100;
  const totalWithTax = grandTotal + taxAmount;

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Action buttons - hidden on print */}
      <div className="flex gap-3 mb-6 print:hidden">
        <a href={`/dashboard/workorders/${params.id}`}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors inline-block">
          ← {t("back")}
        </a>
        <button onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors">
          {t("printSavePdf")}
        </button>
      </div>

      {/* Report */}
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-2xl p-8 text-gray-900 print:shadow-none print:rounded-none print:p-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {order.shop?.logoUrl ? (
              <img src={order.shop.logoUrl} alt="logo" className="w-12 h-12 object-contain rounded-lg" />
            ) : (
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl">🔧</div>
            )}
            <div>
              <h2 className="font-bold text-xl">{order.shop?.name ?? "FixFlow"}</h2>
              {order.shop?.address && <p className="text-xs text-gray-500">{order.shop.address}</p>}
              {order.shop?.phone && <p className="text-xs text-gray-500">{order.shop.phone}</p>}
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-900">{t("deviceHealthReport")}</h1>
            <p className="text-xs text-gray-500 mt-1">{t("postRepairAssessment")}</p>
            <p className="text-sm font-mono font-bold mt-1">
              {order.orderNumber.startsWith("wo-") ? order.orderNumber.toUpperCase() : `WO-${new Date(order.receivedAt).getFullYear()}-${order.orderNumber.slice(0, 6).toUpperCase()}`}
            </p>
            <p className="text-xs text-gray-500">{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">{order.status}</span>
          </div>
        </div>

        {/* Customer + Device */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{t("customer")}</h3>
            <div className="space-y-1.5">
              <div><p className="text-xs text-gray-400">{t("name")}</p><p className="text-sm font-medium">{order.customerName}</p></div>
              <div><p className="text-xs text-gray-400">{t("phone")}</p><p className="text-sm font-medium">{order.customerPhone}</p></div>
              {order.customerEmail && <div><p className="text-xs text-gray-400">{t("email")}</p><p className="text-sm font-medium">{order.customerEmail}</p></div>}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{t("device")}</h3>
            <div className="space-y-1.5">
              <div><p className="text-xs text-gray-400">{t("device")}</p><p className="text-sm font-medium">{order.deviceBrand} {order.deviceModel}</p></div>
              {order.serialNumber && <div><p className="text-xs text-gray-400">{t("serialNumber")}</p><p className="text-sm font-mono">{order.serialNumber}</p></div>}
              {order.imei && <div><p className="text-xs text-gray-400">{t("imei")}</p><p className="text-sm font-mono">{order.imei}</p></div>}
            </div>
          </div>
        </div>

        {/* Repair Summary */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{t("repairSummary")}</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">{t("issueReported")}</span><span className="font-medium text-right max-w-xs">{order.faultDescription}</span></div>
            {order.repairType && <div className="flex justify-between text-sm"><span className="text-gray-500">{t("repairType")}</span><span className="font-medium">{order.repairType}</span></div>}
            <div className="flex justify-between text-sm"><span className="text-gray-500">{t("receivedLabel2")}</span><span className="font-medium">{new Date(order.receivedAt).toLocaleDateString()}</span></div>
            {order.doneAt && <div className="flex justify-between text-sm"><span className="text-gray-500">{t("completedLabel")}</span><span className="font-medium">{new Date(order.doneAt).toLocaleDateString()}</span></div>}
            <div className="flex justify-between text-sm"><span className="text-gray-500">{t("technicianLabel")}</span><span className="font-medium">{order.assignee?.name ?? order.creator.name}</span></div>
          </div>
        </div>

        {/* Parts Replaced */}
        {order.parts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{t("partsReplaced")}</h3>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200">
                <th className="text-left py-2 text-xs text-gray-400 font-medium">{t("part")}</th>
                <th className="text-left py-2 text-xs text-gray-400 font-medium">{t("partNumber")}</th>
                <th className="text-right py-2 text-xs text-gray-400 font-medium">{t("quantity")}</th>
                <th className="text-right py-2 text-xs text-gray-400 font-medium">{t("total")}</th>
              </tr></thead>
              <tbody>
                {order.parts.map(p => (
                  <tr key={p.id} className="border-b border-gray-100">
                    <td className="py-2 font-medium">{p.sparePart.name}</td>
                    <td className="py-2 text-gray-500 font-mono text-xs">{p.sparePart.partNumber || "—"}</td>
                    <td className="py-2 text-right">{p.quantity}</td>
                    <td className="py-2 text-right font-medium">{fmt(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Diagnosis Results */}
        {order.checklist.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{t("deviceConditionAssessment")}</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-green-50 rounded-lg p-2 text-center"><p className="text-lg font-bold text-green-600">{checkOK.length}</p><p className="text-xs text-green-600">OK</p></div>
              <div className="bg-red-50 rounded-lg p-2 text-center"><p className="text-lg font-bold text-red-600">{checkIssue.length}</p><p className="text-xs text-red-600">{t("issuesLabel")}</p></div>
              <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-lg font-bold text-gray-600">{checkNA.length}</p><p className="text-xs text-gray-600">N/A</p></div>
            </div>
            <div className="space-y-1">
              {order.checklist.filter(c => c.status !== "PENDING").map(c => (
                <div key={c.id} className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-sm text-gray-700">{c.item}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.status === "OK" ? "bg-green-100 text-green-700" :
                    c.status === "ISSUE" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>{c.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total */}
        <div className="mb-6 border-t border-gray-200 pt-4">
          {order.parts.length > 0 && <div className="flex justify-between text-sm text-gray-500 mb-1"><span>{t("parts")}</span><span>{fmt(order.subtotal)}</span></div>}
          {order.lineItems.map(item => (
            <div key={item.id} className="flex justify-between text-sm text-gray-500 mb-1"><span>{item.label}</span><span>{fmt(item.amount)}</span></div>
          ))}
          {order.discount > 0 && <div className="flex justify-between text-sm text-gray-500 mb-1"><span>{t("discountLabel")}</span><span>-{fmt(order.discount)}</span></div>}
          {taxAmount > 0 ? (
            <>
              <div className="flex justify-between text-sm text-gray-500 mb-1"><span>{t("subtotalLabel")}</span><span>{fmt(grandTotal)}</span></div>
              <div className="flex justify-between text-sm text-gray-500 mb-1"><span>{order.taxRate}% {t("taxLabel")}</span><span>{fmt(taxAmount)}</span></div>
              <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-2"><span>{t("totalInclTax")}</span><span>{fmt(totalWithTax)}</span></div>
            </>
          ) : (
            <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-2"><span>{t("total")}</span><span>{fmt(grandTotal)}</span></div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
          <p>{t("healthReportFooter")} {order.shop?.name ?? "FixFlow"}.</p>
          <p className="mt-1">{t("generatedBy")} {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}