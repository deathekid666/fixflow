"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  userId: string;
}

// ── Service Worker Registration ───────────────────────────────────────────────
async function registerSW() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw-dashboard.js", { scope: "/dashboard" });
    return reg;
  } catch {
    return null;
  }
}

// ── Push Subscription ─────────────────────────────────────────────────────────
async function subscribeToPush(reg: ServiceWorkerRegistration) {
  if (!("PushManager" in window)) return;
  if (Notification.permission === "denied") return;

  try {
    const keyRes = await fetch("/api/push/vapid-key", { credentials: "include" });
    if (!keyRes.ok) return;
    const { publicKey } = await keyRes.json();
    if (!publicKey) return;

    const existing = await reg.pushManager.getSubscription();
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh: arrayBufferToBase64(sub.getKey("p256dh")!), auth: arrayBufferToBase64(sub.getKey("auth")!) } }),
    });
  } catch { /* user denied or browser unsupported */ }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// ── Pull to Refresh ───────────────────────────────────────────────────────────
function usePullToRefresh() {
  const startY = useRef(0);
  const pulling = useRef(false);
  const [indicator, setIndicator] = useState(0); // 0–1 progress

  useEffect(() => {
    const el = document.getElementById("dashboard-main") ?? document.documentElement;

    function onTouchStart(e: TouchEvent) {
      if (el.scrollTop > 0) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }

    function onTouchMove(e: TouchEvent) {
      if (!pulling.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy < 0) { pulling.current = false; setIndicator(0); return; }
      setIndicator(Math.min(1, dy / 80));
    }

    function onTouchEnd() {
      if (!pulling.current) return;
      pulling.current = false;
      if (indicator >= 1) {
        setIndicator(0);
        window.location.reload();
      } else {
        setIndicator(0);
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [indicator]);

  return indicator;
}

// ── Install Banner ────────────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const INSTALL_DISMISSED_KEY = "ff_install_dismissed_v1";

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
    || window.matchMedia("(display-mode: standalone)").matches;
}

export default function DashboardPWA({ userId }: Props) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [notifState, setNotifState] = useState<"idle" | "requested" | "granted" | "denied">("idle");
  const pullProgress = usePullToRefresh();
  const regRef = useRef<ServiceWorkerRegistration | null>(null);

  // Register SW on mount
  useEffect(() => {
    registerSW().then((reg) => { regRef.current = reg; });
  }, []);

  // Capture install prompt (Android/Chrome)
  useEffect(() => {
    const dismissed = !!localStorage.getItem(INSTALL_DISMISSED_KEY);
    if (dismissed) return;

    const handler = (e: Event) => setDeferredPrompt(e as BeforeInstallPromptEvent);
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Show install banner after 30s (Android/Chrome fires beforeinstallprompt)
  useEffect(() => {
    if (!deferredPrompt) return;
    const t = setTimeout(() => setShowBanner(true), 30_000);
    return () => clearTimeout(t);
  }, [deferredPrompt]);

  // iOS: show manual instructions after 30s if not already installed
  useEffect(() => {
    if (!isIOS() || isInStandaloneMode()) return;
    const dismissed = !!localStorage.getItem(INSTALL_DISMISSED_KEY);
    if (dismissed) return;
    const t = setTimeout(() => setShowIOSBanner(true), 30_000);
    return () => clearTimeout(t);
  }, []);

  // Request push permission and subscribe after SW is ready
  useEffect(() => {
    if (!userId) return;
    if (Notification.permission === "granted") {
      setNotifState("granted");
      if (regRef.current) subscribeToPush(regRef.current);
    }
    // Listen for SW ready then subscribe
    navigator.serviceWorker?.ready.then((reg) => {
      regRef.current = reg;
      if (Notification.permission === "granted") subscribeToPush(reg);
    });
  }, [userId]);

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "dismissed") localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
    setDeferredPrompt(null);
    setShowBanner(false);
  }

  function dismissBanner() {
    localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
    setShowBanner(false);
    setShowIOSBanner(false);
  }

  async function requestPush() {
    setNotifState("requested");
    const permission = await Notification.requestPermission();
    setNotifState(permission === "granted" ? "granted" : "denied");
    if (permission === "granted" && regRef.current) {
      await subscribeToPush(regRef.current);
    }
  }

  return (
    <>
      {/* Pull to refresh indicator */}
      {pullProgress > 0 && (
        <div
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center pointer-events-none"
          style={{ height: 44, transform: `translateY(${(pullProgress - 1) * 44}px)`, opacity: pullProgress }}
        >
          <div className="bg-blue-600 text-white rounded-full px-4 py-1.5 text-xs font-semibold shadow-lg flex items-center gap-2">
            <svg
              className="w-3.5 h-3.5"
              style={{ transform: `rotate(${pullProgress * 360}deg)`, transition: "transform 0.1s" }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {pullProgress >= 1 ? "Release to refresh" : "Pull to refresh"}
          </div>
        </div>
      )}

      {/* Install banner */}
      {showBanner && (
        <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:w-80 z-50 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-xl flex-shrink-0">🔧</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Install FixFlow</p>
              <p className="text-xs text-slate-400 mt-0.5">Add to your home screen for faster access and offline support.</p>
            </div>
            <button onClick={dismissBanner} className="text-slate-500 hover:text-slate-300 text-lg leading-none flex-shrink-0">✕</button>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={install}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Install App
            </button>
            <button
              onClick={dismissBanner}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      )}

      {/* iOS install instructions */}
      {showIOSBanner && !showBanner && (
        <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:w-80 z-50 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-xl flex-shrink-0">🔧</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Install FixFlow</p>
              <p className="text-xs text-slate-400 mt-1">
                Tap the <span className="text-white font-medium">Share</span> button (&#x23F6;) at the bottom of Safari, then choose <span className="text-white font-medium">&ldquo;Add to Home Screen&rdquo;</span>.
              </p>
            </div>
            <button onClick={dismissBanner} className="text-slate-500 hover:text-slate-300 text-lg leading-none flex-shrink-0">✕</button>
          </div>
          {/* Triangle pointer */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-r border-b border-slate-700 rotate-45" />
        </div>
      )}

      {/* Push notification permission prompt — shown after 45s if not yet granted */}
      {notifState === "idle" && !showBanner && !showIOSBanner && (
        <PushPrompt onAccept={requestPush} onDismiss={() => setNotifState("denied")} />
      )}
    </>
  );
}

// Shown once, 45s after load, if push not yet granted
function PushPrompt({ onAccept, onDismiss }: { onAccept: () => void; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "default") return;
    const dismissed = !!localStorage.getItem("ff_push_dismissed_v1");
    if (dismissed) return;
    const t = setTimeout(() => setVisible(true), 45_000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem("ff_push_dismissed_v1", "1");
    setVisible(false);
    onDismiss();
  }

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:w-80 z-50 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-xl flex-shrink-0">🔔</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Enable notifications</p>
          <p className="text-xs text-slate-400 mt-0.5">Get alerted for new messages, appointments, and overdue orders.</p>
        </div>
        <button onClick={dismiss} className="text-slate-500 hover:text-slate-300 text-lg leading-none flex-shrink-0">✕</button>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => { setVisible(false); onAccept(); }}
          className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          Enable
        </button>
        <button
          onClick={dismiss}
          className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
