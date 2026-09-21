"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useAuth } from "@/context/AuthContext";
import { readWorkspaceVisibility, type WorkspaceVisibility } from "@/lib/workspace";

const CHANGE_EVENT = "fixflow:workspace-change";
const serverSnapshot = () => null;

export function useWorkspace() {
  const { user } = useAuth();
  const storageKey = user ? `fixflow:workspace:v1:${user.shopId ?? "platform"}:${user.id}` : null;
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener("storage", callback);
    window.addEventListener(CHANGE_EVENT, callback);
    return () => {
      window.removeEventListener("storage", callback);
      window.removeEventListener(CHANGE_EVENT, callback);
    };
  }, []);
  const getSnapshot = useCallback(() => {
    try { return storageKey ? localStorage.getItem(storageKey) : null; }
    catch { return null; }
  }, [storageKey]);
  const raw = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
  const visible = useMemo(() => readWorkspaceVisibility(raw), [raw]);
  const save = useCallback((next: WorkspaceVisibility) => {
    if (!storageKey) return false;
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      window.dispatchEvent(new Event(CHANGE_EVENT));
      return true;
    } catch { return false; }
  }, [storageKey]);
  return { visible, save };
}
