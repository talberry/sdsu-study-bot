"use client";

import React, { createContext, useContext, ReactNode } from "react";
import useCanvasToken from "../hooks/useCanvasToken";

type CanvasTokenContextValue = ReturnType<typeof useCanvasToken>;

const CanvasTokenContext = createContext<CanvasTokenContextValue | null>(null);

export function CanvasTokenProvider({ children }: { children: ReactNode }) {
  const value = useCanvasToken();
  return (
    <CanvasTokenContext.Provider value={value}>
      {children}
    </CanvasTokenContext.Provider>
  );
}

export function useCanvasTokenContext() {
  const ctx = useContext(CanvasTokenContext);
  if (!ctx)
    throw new Error(
      "useCanvasTokenContext must be used within CanvasTokenProvider"
    );
  return ctx;
}
