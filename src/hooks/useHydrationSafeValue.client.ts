"use client";

import { useCallback, useSyncExternalStore } from "react";

const noopSubscribe = () => () => undefined;

export function useHydrationSafeValue<TValue>(serverValue: TValue, getClientValue: () => TValue): TValue {
  const getServerValue = useCallback(() => serverValue, [serverValue]);

  return useSyncExternalStore(noopSubscribe, getClientValue, getServerValue);
}
