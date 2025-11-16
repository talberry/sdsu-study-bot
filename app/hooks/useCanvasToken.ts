"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "canvas_token";

export default function useCanvasToken() {
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
      if (stored) setTokenState(stored);
    } catch (e) {
      // ignore (sessionStorage may be unavailable)
    }
  }, []);

  const setToken = useCallback((newToken: string) => {
    setTokenState(newToken);
    try {
      if (typeof window !== "undefined") sessionStorage.setItem(STORAGE_KEY, newToken);
    } catch (e) {}
  }, []);

  const clearToken = useCallback(() => {
    setTokenState(null);
    try {
      if (typeof window !== "undefined") sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }, []);

  return { token, setToken, clearToken } as const;
}
