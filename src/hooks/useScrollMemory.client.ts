"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SCROLL_MEMORY_LIMIT = 50;
const scrollMap = new Map<string, number>();

/**
 * React Router hands out a unique location key per history entry; App Router does not,
 * so the path plus query stands in. Two visits to the same URL therefore share a
 * remembered offset, which is the behaviour a reader expects anyway.
 */
export function useScrollMemory() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    window.scrollTo({ top: scrollMap.get(key) ?? 0 });

    return () => {
      scrollMap.set(key, window.scrollY);
      if (scrollMap.size > SCROLL_MEMORY_LIMIT) {
        const oldestKey = scrollMap.keys().next().value;
        if (oldestKey) scrollMap.delete(oldestKey);
      }
    };
  }, [key]);
}
