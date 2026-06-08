"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function TrialBanner() {
  const { user } = useAuth();

  if (!user || user.isSuperAdmin) return null;
  if (!user.shop) return null;
  if (user.shop.onboardingComplete === false) return null; // Don't show during onboarding

  const trialEndsAt = (user as any).trialEndsAt;
  if (!trialEndsAt) return null;

  const daysLeft = Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000));

  if (daysLeft > 7) return null; // Only show when 7 days or less

  const isUrgent = daysLeft <= 3;

  return (
    <div className={`px-4 py-2 flex items-center justify-between text-xs ${
      isUrgent ? "bg-red-900/50 border-b border-red-800/50" : "bg-yellow-900/30 border-b border-yellow-800/30"
    }`}>
      <span className={isUrgent ? "text-red-300" : "text-yellow-300"}>
        {daysLeft === 0
          ? "⚠️ Your trial has expired"
          : `⏰ Your trial expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
      </span>
      <a href="mailto:support@fixflow.ma?subject=Upgrade to PRO"
        className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
          isUrgent ? "bg-red-600 hover:bg-red-500 text-white" : "bg-yellow-600 hover:bg-yellow-500 text-white"
        }`}>
        Upgrade now
      </a>
    </div>
  );
}