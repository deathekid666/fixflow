"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const ShopMap = dynamic(() => import("@/components/ShopMap"), { ssr: false });

type Review = { rating: number; comment: string | null; brand: string; date: string | null };

type ShopProfile = {
  id: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  certification: string | null;
  phone: string | null;
  email: string | null;
  googleMapsUrl: string | null;
  completedRepairs: number;
  avgRating: number | null;
  ratingCount: number;
  reviews: Review[];
};

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`${cls} ${s <= Math.round(rating) ? "text-amber-400" : "text-slate-600"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default function ShopProfilePage({ params }: { params: { shopId: string } }) {
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/directory/${params.shopId}`)
      .then((r) => { if (!r.ok) { setNotFound(true); setLoading(false); return null; } return r.json(); })
      .then((d) => { if (d) { setShop(d); setLoading(false); } })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [params.shopId]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-5 py-3.5 flex items-center gap-4">
          <Link href="/directory" className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5">
            ← Directory
          </Link>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-sm text-slate-900 dark:text-white font-medium truncate">{shop?.name ?? "Shop"}</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-5 py-10">
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-3 pt-2">
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              </div>
            </div>
            <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          </div>
        )}

        {notFound && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <h1 className="text-2xl font-bold mb-2">Shop not found</h1>
            <p className="text-slate-500 mb-6">This shop may not be listed or is no longer active.</p>
            <Link href="/directory" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors">
              Browse all shops
            </Link>
          </div>
        )}

        {shop && !loading && (
          <div className="space-y-6">
            {/* Header card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
                  {shop.logoUrl
                    ? <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" />
                    : <span className="text-4xl">🔧</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold">{shop.name}</h1>
                    {shop.certification && (
                      <span className="mt-1 text-xs bg-amber-500/15 border border-amber-500/30 text-amber-500 px-2 py-1 rounded-full font-semibold">
                        ✦ {shop.certification}
                      </span>
                    )}
                  </div>
                  {(shop.city || shop.country) && (
                    <p className="text-sm text-slate-500 mt-1">📍 {[shop.city, shop.country].filter(Boolean).join(", ")}</p>
                  )}
                  {shop.address && !shop.city && (
                    <p className="text-sm text-slate-500 mt-1">📍 {shop.address}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    {shop.avgRating !== null ? (
                      <div className="flex items-center gap-2">
                        <Stars rating={shop.avgRating} size="lg" />
                        <span className="text-lg font-bold">{shop.avgRating.toFixed(1)}</span>
                        <span className="text-slate-500 text-sm">({shop.ratingCount} review{shop.ratingCount !== 1 ? "s" : ""})</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-sm">No ratings yet</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{shop.completedRepairs.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Repairs done</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-500">{shop.avgRating?.toFixed(1) ?? "—"}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Avg rating</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{shop.ratingCount}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Reviews</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-5">
                <Link href={`/book/${shop.id}`}
                  className="flex-1 text-center py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/20">
                  Book a Repair
                </Link>
                {shop.phone && (
                  <a href={`tel:${shop.phone}`}
                    className="flex-1 text-center py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-colors">
                    📞 Call
                  </a>
                )}
                {shop.googleMapsUrl && (
                  <a href={shop.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-center py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-colors">
                    🗺 Directions
                  </a>
                )}
              </div>
            </div>

            {/* Map */}
            {shop.lat !== null && shop.lng !== null && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Location</h2>
                <ShopMap lat={shop.lat} lng={shop.lng} name={shop.name} />
                {shop.address && (
                  <p className="text-sm text-slate-500 mt-3">📍 {shop.address}</p>
                )}
              </div>
            )}

            {/* Reviews */}
            {shop.reviews.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Customer Reviews</h2>
                <div className="space-y-4">
                  {shop.reviews.map((r, i) => (
                    <div key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <Stars rating={r.rating} />
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {r.brand && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{r.brand}</span>}
                          {r.date && <span>{new Date(r.date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      {r.comment && <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">"{r.comment}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            {(shop.email || shop.phone) && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Contact</h2>
                <div className="space-y-2">
                  {shop.phone && (
                    <a href={`tel:${shop.phone}`} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <span className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-base">📞</span>
                      {shop.phone}
                    </a>
                  )}
                  {shop.email && (
                    <a href={`mailto:${shop.email}`} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <span className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-base">✉️</span>
                      {shop.email}
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="text-center pt-2 pb-8">
              <p className="text-xs text-slate-500">
                This shop uses <Link href="/" className="text-blue-500 hover:text-blue-400 transition-colors">FixFlow</Link> to manage repairs.{" "}
                <Link href="/register" className="text-blue-500 hover:text-blue-400 transition-colors">Add your shop →</Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
