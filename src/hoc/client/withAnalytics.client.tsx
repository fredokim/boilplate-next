"use client";

import type { ComponentType } from "react";
import { useEffect } from "react";

export function withAnalytics<P extends object>(eventName: string, Component: ComponentType<P>) {
  return function AnalyticsWrappedComponent(props: P) {
    useEffect(() => {
      window.dispatchEvent(new CustomEvent("analytics:page", { detail: { eventName } }));
    }, []);

    return <Component {...props} />;
  };
}
