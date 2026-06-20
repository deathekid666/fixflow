"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";

type WorkOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deviceBrand: string;
  deviceModel: string;
  total: number;
  collected: number;
  doneAt: string | null;
};

type DailySummary = {
  total: number;
  byMethod: Record<string, number>;
  count: number;
};

const METHODS = [
  { key: "CASH", icon: "💵", label: "Cash" },
  { key: "CARD", icon: "💳", label: "Card" },
  { key: "BANK_TRANSFER", icon: "🏦", label: "Bank" },
];

const METHOD_LABEL: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
  OTHER: "Other",
};

const METHOD_ICON: Record<string, string> = {
  CASH: "💵",
  CARD: "💳",
  BANK_TRANSFER: "🏦",
  OTHER: "💰",
};

export default function POSPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WorkOrder | null>(null);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [method, setMethod] = useState("CASH");
  const [customerPays, setCustomerPays] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [lastDeliveredId, setLastDeliveredId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/workorders?status=DONE&limit=100", { credentials: "include" });
      if (res.ok) setOrders(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/pos/summary", { credentials: "include" });
      if (res.ok) setSummary(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadOrders();
    loadSummary();
  }, [loadOrders, loadSummary]);

  function selectOrder(order: WorkOrder) {
    setSelected(order);
    setCustomerPays("");
    setMethod("CASH");
    setError("");
    setSuccessMsg("");
  }

  const balanceDue = selected ? Math.max(0, selected.total - selected.collected) : 0;
  const customerPaysNum = parseFloat(customerPays) || 0;
  const change = Math.max(0, customerPaysNum - balanceDue);

  async function checkout() {
    if (!selected) return;
    if (balanceDue > 0 && customerPaysNum < balanceDue) {
      setError("Amount entered is less than balance due");
      return;
    }
    if (balanceDue === 0 && customerPaysNum <= 0) {
      // Already fully paid — just deliver
    }

    setProcessing(true);
    setError("");

    try {
      if (balanceDue > 0) {
        const payRes = await fetch(`/api/workorders/${selected.id}/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ amount: balanceDue, method }),
        });
        if (!payRes.ok) {
          const d = await payRes.json();
          setError(d.error || "Payment failed");
          setProcessing(false);
          return;
        }
      }

      const statusRes = await fetch(`/api/workorders/${selected.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "DELIVERED" }),
      });
      if (!statusRes.ok) {
        const d = await statusRes.json();
        setError(d.error || "Failed to mark as delivered");
        setProcessing(false);
        return;
      }

      const name = selected.customerName;
      const deliveredId = selected.id;
      setSelected(null);
      setLastDeliveredId(deliveredId);
      setSuccessMsg(`✓ ${name}'s device delivered!`);
      setTimeout(() => { setSuccessMsg(""); setLastDeliveredId(null); }, 8000);
      await Promise.all([loadOrders(), loadSummary()]);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex flex-col bg-slate-100 dark:bg-slate-950 h-[calc(100dvh-57px-64px)] lg:h-[calc(100dvh-57px)]">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">{t("posTitle")}</h1>
          <p className="text-xs text-slate-500">{loading ? t("loading") : `${orders.length} ${t("ordersReadyPickup")}`}</p>
        </div>
        {summary && (
          <div className="text-right">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">{t("todayLabel")}</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{summary.total.toFixed(2)} <span className="text-sm font-normal text-slate-400">MAD</span></p>
          </div>
        )}
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="mx-4 mt-3 px-4 py-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 text-sm font-medium flex-shrink-0 flex items-center justify-between gap-3">
          <span>{successMsg}</span>
          {lastDeliveredId && (
            <a
              href={`/print/${lastDeliveredId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap text-xs font-semibold underline underline-offset-2 text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
            >
              🖨️ Print
            </a>
          )}
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Order list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-w-0">
          {loading && (
            <div className="flex flex-col gap-2 pt-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 rounded-xl bg-white dark:bg-slate-900 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">{t("noOrdersWaiting")}</p>
              <p className="text-sm text-slate-400 mt-1">{t("allDelivered")}</p>
            </div>
          )}

          {orders.map(order => {
            const balance = Math.max(0, order.total - order.collected);
            const isPaid = order.total > 0 && balance === 0;
            const isSelected = selected?.id === order.id;

            return (
              <button
                key={order.id}
                onClick={() => selectOrder(order)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all active:scale-[0.98] ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                    : "border-transparent bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white truncate text-[15px]">{order.customerName}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{order.deviceBrand} {order.deviceModel}</p>
                    <p className="text-xs text-slate-400 mt-0.5">#{order.orderNumber.slice(-8)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-slate-900 dark:text-white text-[15px]">{order.total.toFixed(2)} <span className="text-xs font-normal text-slate-400">MAD</span></p>
                    {isPaid
                      ? <span className="text-xs text-green-500 font-medium">Paid ✓</span>
                      : balance > 0
                        ? <span className="text-xs text-orange-500 font-medium">Due: {balance.toFixed(2)}</span>
                        : null
                    }
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Checkout panel — right column on lg+, bottom overlay on mobile */}
        {selected && (
          <>
            {/* Mobile backdrop */}
            <div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => { setSelected(null); setError(""); }}
            />

            <div className={`
              fixed inset-x-0 bottom-0 max-h-[90dvh] z-50 rounded-t-2xl overflow-hidden flex flex-col
              bg-white dark:bg-slate-900 shadow-2xl
              lg:relative lg:inset-auto lg:rounded-none lg:max-h-full lg:z-auto lg:shadow-none
              lg:w-80 xl:w-96 lg:flex-shrink-0 lg:border-l lg:border-slate-200 lg:dark:border-slate-800
            `}>
              {/* Drag handle (mobile only) */}
              <div className="lg:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-9 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              </div>

              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                <h2 className="font-bold text-slate-900 dark:text-white text-lg">{t("checkoutTitle")}</h2>
                <button
                  onClick={() => { setSelected(null); setError(""); }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >✕</button>
              </div>

              {/* Panel body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">

                {/* Order summary card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-1.5">
                  <p className="font-semibold text-slate-900 dark:text-white">{selected.customerName}</p>
                  <p className="text-sm text-slate-500">{selected.deviceBrand} {selected.deviceModel}</p>
                  <p className="text-xs text-slate-400">{selected.customerPhone} · #{selected.orderNumber.slice(-8)}</p>
                  <div className="pt-3 mt-1 border-t border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">{t("orderTotal")}</span>
                      <span className="font-medium text-slate-900 dark:text-white">{selected.total.toFixed(2)} MAD</span>
                    </div>
                    {selected.collected > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">{t("alreadyCollected")}</span>
                        <span className="text-green-600 dark:text-green-400">{selected.collected.toFixed(2)} MAD</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base pt-1">
                      <span className="font-semibold text-slate-900 dark:text-white">{t("balanceDue")}</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">{balanceDue.toFixed(2)} MAD</span>
                    </div>
                  </div>
                </div>

                {/* Payment method */}
                {balanceDue > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">{t("paymentMethod")}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {METHODS.map(m => (
                        <button
                          key={m.key}
                          onClick={() => setMethod(m.key)}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-sm font-medium transition-all active:scale-95 ${
                            method === m.key
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                              : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                          }`}
                        >
                          <span className="text-xl leading-none">{m.icon}</span>
                          <span className="text-xs">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cash amount + change calculator */}
                {balanceDue > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2.5">{t("customerPays")}</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={customerPays}
                      onChange={e => { setCustomerPays(e.target.value); setError(""); }}
                      placeholder={balanceDue.toFixed(2)}
                      className="pos-amount-input w-full text-3xl font-bold text-center py-4 px-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                    {customerPaysNum > 0 && (
                      <div className={`mt-3 p-4 rounded-2xl text-center transition-colors ${
                        change > 0
                          ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                          : "bg-slate-50 dark:bg-slate-800"
                      }`}>
                        {change > 0 ? (
                          <>
                            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">{t("changeToGive")}</p>
                            <p className="text-4xl font-bold text-green-600 dark:text-green-400">{change.toFixed(2)}</p>
                            <p className="text-sm text-slate-400 mt-0.5">MAD</p>
                          </>
                        ) : (
                          <p className="text-sm text-slate-400 font-medium">{t("noChangeDue")}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {balanceDue === 0 && (
                  <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center">
                    <p className="text-green-700 dark:text-green-300 font-medium text-sm">{t("orderFullyPaid")}</p>
                    <p className="text-green-600 dark:text-green-400 text-xs mt-0.5">{t("tapDeliver")}</p>
                  </div>
                )}

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 rounded-xl">
                    {error}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex-shrink-0 p-5 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] lg:pb-5">
                <button
                  onClick={checkout}
                  disabled={processing || (balanceDue > 0 && customerPaysNum < balanceDue && customerPaysNum > 0)}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg transition-colors"
                >
                  {processing
                    ? "Processing…"
                    : balanceDue === 0
                      ? t("markAsDelivered")
                      : `✓ Collect ${balanceDue.toFixed(2)} MAD & Deliver`
                  }
                </button>
                <a
                  href={`/print/${selected.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 transition-colors"
                >
                  🖨️ {t("printReceipt")}
                </a>
              </div>
            </div>
          </>
        )}

        {/* Empty right panel on desktop when nothing selected */}
        {!selected && (
          <div className="hidden lg:flex w-80 xl:w-96 flex-shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-col items-center justify-center p-8 text-center">
            <div className="text-5xl mb-4">👆</div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">{t("selectAnOrder")}</p>
            <p className="text-sm text-slate-400 mt-1">{t("tapDoneOrder")}</p>
          </div>
        )}
      </div>

      {/* Daily summary bar */}
      {summary && summary.count > 0 && (
        <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-5 py-3 flex items-center gap-5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{t("todayLabel")}</p>
          {Object.entries(summary.byMethod).map(([m, amt]) => (
            <div key={m} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-base leading-none">{METHOD_ICON[m] ?? "💰"}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">{METHOD_LABEL[m] ?? m}</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{(amt as number).toFixed(2)}</span>
            </div>
          ))}
          <div className="ml-auto pl-5 border-l border-slate-200 dark:border-slate-700 whitespace-nowrap flex-shrink-0">
            <span className="text-sm font-bold text-green-600 dark:text-green-400">{summary.total.toFixed(2)} MAD</span>
            <span className="text-xs text-slate-400 ml-1">total</span>
          </div>
        </div>
      )}
    </div>
  );
}
