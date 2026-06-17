import { useEffect, useRef } from "react";

// Module-level counter: when > 0, non-priority listeners yield to priority ones
let priorityCount = 0;

export function useBarcodeScanner({
  onScan,
  enabled = true,
  priority = false,
  minLength = 3,
}: {
  onScan: (code: string) => void;
  enabled?: boolean;
  priority?: boolean;
  minLength?: number;
}) {
  const callbackRef = useRef(onScan);
  callbackRef.current = onScan;

  useEffect(() => {
    if (!enabled) return;
    if (priority) priorityCount++;

    let buffer = "";
    let lastKeyTime = 0;
    let flushTimer: ReturnType<typeof setTimeout> | null = null;

    function flush() {
      const code = buffer.trim();
      buffer = "";
      if (code.length < minLength) return;
      if (!priority && priorityCount > 0) return; // yield to priority scanner
      callbackRef.current(code);
    }

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      // Don't intercept keystrokes going into form elements
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;

      const now = Date.now();
      const gap = now - lastKeyTime;
      lastKeyTime = now;

      // Long gap = human typing, not a scanner — reset buffer
      if (gap > 250 && buffer.length > 0) buffer = "";

      if (flushTimer) clearTimeout(flushTimer);

      if (e.key === "Enter" || e.key === "Tab") {
        flush();
        return;
      }

      if (e.key.length === 1) {
        buffer += e.key;
        // Auto-flush after 150ms of silence (handles scanners that don't emit Enter)
        flushTimer = setTimeout(flush, 150);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (flushTimer) clearTimeout(flushTimer);
      if (priority) priorityCount = Math.max(0, priorityCount - 1);
    };
  }, [enabled, priority, minLength]);
}
