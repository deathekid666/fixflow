"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Conversation = {
  id: string;
  message: string;
  senderType: string;
  createdAt: string;
  workOrderId: string;
  workOrder: {
    id: string;
    orderNumber: string;
    customerName: string;
    deviceBrand: string;
    deviceModel: string;
    status: string;
  };
};

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: "bg-blue-500/20 text-blue-500",
  DIAGNOSING: "bg-yellow-500/20 text-yellow-500",
  REPAIRING: "bg-orange-500/20 text-orange-500",
  DONE: "bg-green-500/20 text-green-500",
  DELIVERED: "bg-slate-500/20 text-slate-400",
  CANCELLED: "bg-red-500/20 text-red-500",
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/messages", { credentials: "include" })
      .then(r => r.json())
      .then(d => { setConversations(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Messages</h1>
        <p className="text-sm text-slate-400 mt-1">Customer conversations across all work orders</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-4xl mb-4">💬</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">No messages yet.</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            Messages from customers will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(conv => {
            const wo = conv.workOrder;
            const isFromCustomer = conv.senderType === "CUSTOMER";
            return (
              <button
                key={conv.id}
                onClick={() => router.push(`/dashboard/workorders/${wo.id}`)}
                className="w-full text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-blue-400 dark:hover:border-blue-600 transition-colors flex items-start gap-4"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0 text-lg">
                  👤
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {wo.customerName}
                      </span>
                      <span className="text-xs text-slate-400 truncate hidden sm:inline">
                        {wo.deviceBrand} {wo.deviceModel}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[wo.status] ?? "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
                        {wo.status}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(conv.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                    {isFromCustomer
                      ? <span className="text-blue-500 dark:text-blue-400 font-medium">Customer: </span>
                      : <span className="text-slate-400">You: </span>}
                    {conv.message}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {wo.orderNumber.startsWith("wo-")
                      ? wo.orderNumber.toUpperCase()
                      : `WO-${wo.orderNumber.slice(0, 6).toUpperCase()}`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
