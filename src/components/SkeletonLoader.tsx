export function SkeletonCard() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse space-y-3">
      <div className="h-3 bg-slate-700 rounded w-1/3" />
      <div className="h-8 bg-slate-700 rounded w-1/2" />
      <div className="h-3 bg-slate-800 rounded w-1/4" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 px-4 animate-pulse">
      <div className="h-3 bg-slate-700 rounded w-24" />
      <div className="h-3 bg-slate-700 rounded w-32" />
      <div className="h-3 bg-slate-700 rounded w-20" />
      <div className="h-3 bg-slate-700 rounded w-16 ml-auto" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="border-b border-slate-800 px-4 py-3 flex gap-4 animate-pulse">
        {[1,2,3,4,5].map(i => <div key={i} className="h-3 bg-slate-700 rounded w-20" />)}
      </div>
      {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}

export default SkeletonCard;