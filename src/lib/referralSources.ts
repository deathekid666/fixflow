export const REFERRAL_SOURCES = [
  "WALK_IN", "GOOGLE", "INSTAGRAM", "FACEBOOK", "WHATSAPP", "REFERRAL", "OTHER",
] as const;

export type ReferralSource = (typeof REFERRAL_SOURCES)[number];

export const REFERRAL_LABELS: Record<string, string> = {
  WALK_IN: "Walk In",
  GOOGLE: "Google",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  WHATSAPP: "WhatsApp",
  REFERRAL: "Referral",
  OTHER: "Other",
};

export const REFERRAL_BADGE_CLASS: Record<string, string> = {
  WALK_IN:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  GOOGLE:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  INSTAGRAM: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  FACEBOOK:  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  WHATSAPP:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  REFERRAL:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  OTHER:     "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export const REFERRAL_CHART_COLORS: Record<string, string> = {
  WALK_IN: "#10b981",
  GOOGLE: "#3b82f6",
  INSTAGRAM: "#ec4899",
  FACEBOOK: "#6366f1",
  WHATSAPP: "#059669",
  REFERRAL: "#f59e0b",
  OTHER: "#94a3b8",
};
