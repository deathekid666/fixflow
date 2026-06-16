"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import CertBadge from "@/components/CertBadge";

type Shop = {
  id: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  certification: string | null;
  phone: string | null;
  completedRepairs: number;
  avgRating: number | null;
  ratingCount: number;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? "text-amber-400" : "text-slate-600"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default function DirectoryPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/directory")
      .then((r) => r.json())
      .then((d) => { setShops(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = shops.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || (s.city ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <nav className="border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-white tracking-tight">FixFlow</Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5">Sign in</Link>
            <Link href="/register" className="text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-5 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-3.5 py-1.5 rounded-full font-medium mb-5">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Verified Repair Shops
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Find a Repair Shop Near You</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Browse verified repair shops powered by FixFlow. Real ratings from real customers.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-12">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by shop name or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-800 rounded w-2/3" />
                    <div className="h-3 bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-slate-800 rounded w-full" />
                <div className="h-3 bg-slate-800 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-lg font-medium text-slate-400">{search ? "No shops match your search" : "No shops listed yet"}</p>
            <p className="text-sm mt-2">{search ? "Try a different name or city" : "Check back soon"}</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-5">{filtered.length} shop{filtered.length !== 1 ? "s" : ""} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((shop) => (
                <Link key={shop.id} href={`/directory/${shop.id}`}
                  className="group bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-6 flex flex-col gap-4 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/5">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden border border-slate-700 flex-shrink-0">
                      {shop.logoUrl
                        ? <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" />
                        : <span className="text-2xl">🔧</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-white text-sm group-hover:text-blue-400 transition-colors truncate">{shop.name}</h2>
                        {shop.certification && <CertBadge level={shop.certification} size="xs" />}
                      </div>
                      {(shop.city || shop.country) && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          📍 {[shop.city, shop.country].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    {shop.avgRating !== null ? (
                      <div className="flex items-center gap-1.5">
                        <Stars rating={shop.avgRating} />
                        <span className="text-white font-semibold">{shop.avgRating.toFixed(1)}</span>
                        <span className="text-slate-500">({shop.ratingCount})</span>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">No ratings yet</span>
                    )}
                  </div>

                  <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="text-emerald-400">✓</span>
                      <span>{shop.completedRepairs.toLocaleString()} repair{shop.completedRepairs !== 1 ? "s" : ""} completed</span>
                    </div>
                    <span className="text-xs text-blue-400 group-hover:text-blue-300 font-medium transition-colors">View →</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 mt-16">
        <div className="max-w-6xl mx-auto px-5 py-8 flex items-center justify-between flex-wrap gap-4">
          <p className="text-xs text-slate-600">© 2026 FixFlow · <Link href="/" className="hover:text-slate-400 transition-colors">Back to homepage</Link></p>
          <p className="text-xs text-slate-600">Are you a repair shop? <Link href="/register" className="text-blue-400 hover:text-blue-300 transition-colors">Join FixFlow →</Link></p>
        </div>
      </div>
    </div>
  );
}
