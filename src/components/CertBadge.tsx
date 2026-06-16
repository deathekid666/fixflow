import { CERT_META } from "@/lib/certification";

type CertLevel = "BRONZE" | "SILVER" | "GOLD";
type Size = "xs" | "sm" | "md" | "lg";

const SIZE: Record<Size, { px: string; text: string; icon: string }> = {
  xs: { px: "px-1.5 py-0.5", text: "text-[10px]", icon: "text-xs" },
  sm: { px: "px-2 py-0.5",   text: "text-xs",      icon: "text-sm" },
  md: { px: "px-2.5 py-1",   text: "text-sm",      icon: "text-base" },
  lg: { px: "px-3 py-1.5",   text: "text-base",    icon: "text-xl" },
};

export default function CertBadge({
  level,
  size = "sm",
  showLabel = true,
}: {
  level: CertLevel | string | null | undefined;
  size?: Size;
  showLabel?: boolean;
}) {
  if (!level || !(level in CERT_META)) return null;
  const meta = CERT_META[level as CertLevel];
  const s = SIZE[size];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold border ${s.px}`}
      style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}
    >
      <span className={s.icon}>{meta.emoji}</span>
      {showLabel && <span className={s.text}>{meta.label} Certified</span>}
    </span>
  );
}
