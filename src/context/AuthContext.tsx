"use client";

import { createContext, useContext, useEffect, useState } from "react";

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
const ACTIVITY_KEY = "fixflow_last_activity";
const CHECK_INTERVAL_MS = 60_000; // check every 60 s

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

    const interval = setInterval(async () => {
      const stored = localStorage.getItem(ACTIVITY_KEY);
      const lastActivity = stored ? parseInt(stored, 10) : Date.now();
      if (Date.now() - lastActivity >= INACTIVITY_TIMEOUT_MS) {
        clearInterval(interval);
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        setUser(null);
        window.location.href = "/login?reason=timeout";
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      events.forEach(e => window.removeEventListener(e, recordActivity));
      clearInterval(interval);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}