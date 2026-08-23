"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop";

function getBreakpoint(width: number): Breakpoint {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

/**
 * The server has no viewport, so it renders the caller's assumed breakpoint and the
 * real one takes over on the commit after hydration. Reading window during render
 * would crash the server and mismatch the markup.
 */
export function useBreakpoint(serverBreakpoint: Breakpoint = "desktop"): Breakpoint {
  const getServerSnapshot = useCallback(() => serverBreakpoint, [serverBreakpoint]);
  return useSyncExternalStore(subscribe, () => getBreakpoint(window.innerWidth), getServerSnapshot);
}
