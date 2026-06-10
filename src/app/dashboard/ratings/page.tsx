"use client";
import { useEffect, useState, useCallback } from "react";

interface Rating {
  id: string; rating: number; comment: string | null; createdAt: string;
  workOrder: { id: string; orderNumber: string; customerName: string; customerPhone: string; deviceModel: string };
}

function Stars({ n }: { n: number }) {
  return <span><span className="text-yellow-500 dark:text-yellow-400">{"★".repeat(n)}</span><span className="text-slate-300 dark:text-slate-600">{"★".repeat(5 - n)}</span></span>;
}

export default function RatingsPage() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/ratings", { credentials: "include" });
      const data = await res.json();
      setRatings(Array.isArray(data) ? data : []);
    } catch { setError("Failed to load ratings"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const avg = ratings.length > 0 ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1) : null;
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, count: ratings.filter((r) => r.rating === star).length }));

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Customer Satisfaction</h1>
        <p className="text-sm text-slate-500 mt-1">Ratings collected after delivery</p>
      </div>
      {!loading && ratings.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row gap-8 items-start">
          <div className="text-center min-w-[100px]">
            <div className="text-5xl font-bold text-slate-900 dark:text-slate-100">{avg}</div>
            <div className="text-yellow-500 dark:text-yellow-400 text-xl mt-1">{"★".repeat(Math.round(parseFloat(avg!)))}</div>
            <div className="text-xs text-slate-400 mt-1">{ratings.length} reviews</div>
          </div>
          <div className="flex-1 space-y-2 w-full">
            {dist.map(({ star, count }) => {
              const pct = ratings.length ? (count / ratings.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-3">{star}</span>
                  <span className="text-yellow-500 dark:text-yellow-400 text-xs">★</span>
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div className="bg-yellow-500 dark:bg-yellow-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 w-4 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {loading ? <p className="text-sm text-slate-400">Loading...</p> : error ? <p className="text-sm text-red-400">{error}</p> : ratings.length === 0 ? (
        <p className="text-sm text-slate-400">No ratings yet. They appear after work orders are delivered.</p>
      ) : (
        <div className="space-y-3">
          {ratings.map((r) => (
            <div key={r.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">{r.workOrder.customerName} <span className="text-slate-400 font-normal text-xs">{r.workOrder.customerPhone}</span></p>
                  <p className="text-xs text-slate-400">#{r.workOrder.orderNumber.slice(0,6).toUpperCase()} — {r.workOrder.deviceModel}</p>
                </div>
                <div className="flex items-center gap-2"><Stars n={r.rating} /><span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span></div>
              </div>
              {r.comment && <p className="text-sm text-slate-400 italic">"{r.comment}"</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}