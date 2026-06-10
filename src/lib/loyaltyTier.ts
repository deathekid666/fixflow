export type LoyaltyTier = { label: string; className: string };

export function loyaltyTier(orders: number): LoyaltyTier | null {
  if (orders >= 6) return { label: "🥇 Gold",   className: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30" };
  if (orders >= 3) return { label: "🥈 Silver", className: "bg-slate-400/20 text-slate-500 dark:text-slate-300 border border-slate-400/40" };
  if (orders >= 1) return { label: "🥉 Bronze", className: "bg-orange-600/15 text-orange-700 dark:text-orange-400 border border-orange-500/25" };
  return null;
}
