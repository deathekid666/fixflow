import React from "react";

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  RECEIVED:   { bg: "rgba(37,99,235,0.15)",  color: "#2563eb", dot: "#2563eb" },
  DIAGNOSING: { bg: "rgba(217,119,6,0.15)",  color: "#b45309", dot: "#d97706" },
  REPAIRING:  { bg: "rgba(234,88,12,0.15)",  color: "#c2410c", dot: "#ea580c" },
  DONE:       { bg: "rgba(22,163,74,0.15)",  color: "#15803d", dot: "#16a34a" },
  DELIVERED:  { bg: "rgba(71,85,105,0.15)",  color: "#475569", dot: "#475569" },
  CANCELLED:  { bg: "rgba(220,38,38,0.15)",  color: "#b91c1c", dot: "#dc2626" },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.RECEIVED;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: style.bg,
        color: style.color,
        borderRadius: 99,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: style.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

export default StatusBadge;
