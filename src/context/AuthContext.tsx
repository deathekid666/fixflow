"use client";

import { createContext, useContext, useEffect, useState } from "react";

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
const WARN_BEFORE_MS = 5 * 60 * 1000;              // warn 5 min before logout
const ACTIVITY_KEY = "fixflow_last_activity";
const CHECK_INTERVAL_MS = 60_000;                   // coarse check every 60 s

type User = {
  id: string;
  email: string;
  role: string;
  name: string;
  shopId: string | null;
  isSuperAdmin: boolean;
  shop?: {
    id: string;
    name: string;
    onboardingComplete: boolean;
  } | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [warningSecondsLeft, setWarningSecondsLeft] = useState<number | null>(null);

  async function loadUser() {
    setLoading(true);
    const res = await fetch("/api/me", { credentials: "include" });
    if (!res.ok) { setUser(null); setLoading(false); return; }
    const data = await res.json();
    setUser(data);
    setLoading(false);
  }

  useEffect(() => { loadUser(); }, []);

  // Inactivity timeout — tracks activity in localStorage so all tabs share the same timer.
  useEffect(() => {
    if (!user) return;

    localStorage.setItem(ACTIVITY_KEY, String(Date.now()));

    let lastWrite = 0;
    function recordActivity() {
      const now = Date.now();
      if (now - lastWrite > 30_000) {
        lastWrite = now;
        localStorage.setItem(ACTIVITY_KEY, String(now));
      }
    }

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart", "pointerdown"] as const;
    events.forEach(e => window.addEventListener(e, recordActivity, { passive: true }));

    // Coarse check: runs every 60s, enters warning mode when < 5 min remain.
    const interval = setInterval(() => {
      const stored = localStorage.getItem(ACTIVITY_KEY);
      const lastActivity = stored ? parseInt(stored, 10) : Date.now();
      const remaining = INACTIVITY_TIMEOUT_MS - (Date.now() - lastActivity);

      if (remaining <= 0) {
        clearInterval(interval);
        doLogout();
      } else if (remaining <= WARN_BEFORE_MS) {
        setWarningSecondsLeft(prev => prev === null ? Math.ceil(remaining / 1000) : prev);
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      events.forEach(e => window.removeEventListener(e, recordActivity));
      clearInterval(interval);
    };
  }, [user]);

  // Fine-grained 1s countdown — only active while warning is showing.
  useEffect(() => {
    if (warningSecondsLeft === null) return;

    if (warningSecondsLeft <= 0) {
      doLogout();
      return;
    }

    const t = setTimeout(() => {
      const stored = localStorage.getItem(ACTIVITY_KEY);
      const lastActivity = stored ? parseInt(stored, 10) : Date.now();
      const remaining = INACTIVITY_TIMEOUT_MS - (Date.now() - lastActivity);

      if (remaining <= 0) {
        setWarningSecondsLeft(0);
      } else if (remaining <= WARN_BEFORE_MS) {
        setWarningSecondsLeft(Math.ceil(remaining / 1000));
      } else {
        // Activity happened in another tab — dismiss warning
        setWarningSecondsLeft(null);
      }
    }, 1000);

    return () => clearTimeout(t);
  }, [warningSecondsLeft]);

  async function doLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    setWarningSecondsLeft(null);
    window.location.href = "/login?reason=timeout";
  }

  function stayLoggedIn() {
    localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
    setWarningSecondsLeft(null);
  }

  const mins = warningSecondsLeft !== null ? Math.floor(warningSecondsLeft / 60) : 0;
  const secs = warningSecondsLeft !== null ? String(warningSecondsLeft % 60).padStart(2, "0") : "00";

  return (
    <AuthContext.Provider value={{ user, loading, refresh: loadUser }}>
      {children}

      {warningSecondsLeft !== null && user && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none mt-0.5">⏱️</span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Session expiring soon</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  You&apos;ll be signed out in{" "}
                  <span className="font-mono font-semibold text-amber-500">
                    {mins}:{secs}
                  </span>{" "}
                  due to inactivity.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={stayLoggedIn}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                Stay logged in
              </button>
              <button
                onClick={doLogout}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-lg transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
