"use client";
import React from "react";

// ─── Simple inline markdown renderer ─────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i} className="font-semibold text-slate-900 dark:text-white">{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*"))
      return <em key={i} className="italic">{p.slice(1, -1)}</em>;
    return p;
  });
}

export function CopilotMarkdown({ text, className = "" }: { text: string; className?: string }) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let listBuffer: React.ReactNode[] = [];

  function flushList() {
    if (listBuffer.length) {
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="list-disc list-outside ml-5 space-y-0.5 text-sm text-slate-700 dark:text-slate-300">
          {listBuffer}
        </ul>
      );
      listBuffer = [];
    }
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ")) {
      flushList();
      nodes.push(
        <h3 key={i} className="text-sm font-bold text-slate-900 dark:text-white mt-4 mb-1 first:mt-0">
          {trimmed.slice(3)}
        </h3>
      );
    } else if (trimmed.startsWith("### ")) {
      flushList();
      nodes.push(
        <h4 key={i} className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mt-3 mb-1">
          {trimmed.slice(4)}
        </h4>
      );
    } else if (/^[-•*]\s/.test(trimmed)) {
      listBuffer.push(
        <li key={i}>{renderInline(trimmed.replace(/^[-•*]\s/, ""))}</li>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      listBuffer.push(
        <li key={i} className="list-decimal">{renderInline(trimmed.replace(/^\d+\.\s/, ""))}</li>
      );
    } else if (trimmed === "") {
      flushList();
      nodes.push(<div key={i} className="h-1" />);
    } else {
      flushList();
      nodes.push(
        <p key={i} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {renderInline(trimmed)}
        </p>
      );
    }
  });

  flushList();
  return <div className={`space-y-1 ${className}`}>{nodes}</div>;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function CopilotSpinner({ message = "Thinking…" }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
            style={{ animationDelay: `${i * 150}ms`, animationDuration: "0.8s" }}
          />
        ))}
      </div>
      <span className="text-sm text-slate-500 dark:text-slate-400">{message}</span>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

type CopilotPanelProps = {
  title: string;
  description?: string;
  loading: boolean;
  error?: string | null;
  content?: string | null;
  onRefresh?: () => void;
  onDismiss?: () => void;
  className?: string;
  accent?: "violet" | "blue" | "green";
  loadingMessage?: string;
  compact?: boolean;
};

export function CopilotPanel({
  title, description, loading, error, content,
  onRefresh, onDismiss, className = "",
  accent = "violet", loadingMessage,
  compact = false,
}: CopilotPanelProps) {
  const accentColors = {
    violet: {
      badge: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700/50",
      border: "border-violet-200/60 dark:border-violet-800/40",
      bg: "bg-gradient-to-br from-violet-50/80 to-white dark:from-violet-950/20 dark:to-slate-900",
      icon: "text-violet-600 dark:text-violet-400",
      refreshBtn: "text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30",
    },
    blue: {
      badge: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50",
      border: "border-blue-200/60 dark:border-blue-800/40",
      bg: "bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-950/20 dark:to-slate-900",
      icon: "text-blue-600 dark:text-blue-400",
      refreshBtn: "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30",
    },
    green: {
      badge: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/50",
      border: "border-green-200/60 dark:border-green-800/40",
      bg: "bg-gradient-to-br from-green-50/80 to-white dark:from-green-950/20 dark:to-slate-900",
      icon: "text-green-600 dark:text-green-400",
      refreshBtn: "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30",
    },
  }[accent];

  return (
    <div className={`border rounded-xl overflow-hidden ${accentColors.border} ${accentColors.bg} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
        <div className="flex items-center gap-2.5">
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${accentColors.badge}`}>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Copilot
          </div>
          <span className={`text-sm font-semibold ${accentColors.icon}`}>{title}</span>
          {description && !compact && (
            <span className="text-xs text-slate-400 hidden sm:inline">{description}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onRefresh && !loading && (
            <button onClick={onRefresh}
              className={`p-1.5 rounded-lg text-xs transition-colors ${accentColors.refreshBtn}`}
              title="Refresh analysis">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          )}
          {onDismiss && !loading && (
            <button onClick={onDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
              title="Dismiss">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={compact ? "px-4 py-3" : "px-4 py-4"}>
        {loading && <CopilotSpinner message={loadingMessage} />}

        {!loading && error && (
          <div className="flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span>{error}</span>
            {onRefresh && (
              <button onClick={onRefresh} className="ml-auto text-xs underline underline-offset-2 hover:no-underline flex-shrink-0">
                Retry
              </button>
            )}
          </div>
        )}

        {!loading && !error && content && (
          <CopilotMarkdown text={content} />
        )}
      </div>
    </div>
  );
}
