"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { analytics } from "@/core/observability/analytics";

/**
 * App Router has no single location object, so the path is rebuilt from usePathname
 * and useSearchParams. Components using this must sit under a Suspense boundary,
 * because useSearchParams opts the route into client rendering.
 */
export function useRouteAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    analytics.page(query ? `${pathname}?${query}` : pathname);
  }, [pathname, searchParams]);
}
