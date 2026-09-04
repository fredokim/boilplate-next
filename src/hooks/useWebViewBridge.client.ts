"use client";

import { useCallback } from "react";
import { useHydrationSafeValue } from "./useHydrationSafeValue.client";

type WebViewPayload = Record<string, string | number | boolean | null>;

type WebViewMessage = {
  type: string;
  payload?: WebViewPayload;
};

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

export function useWebViewBridge() {
  // The server cannot know it is inside a webview, so it renders as a plain browser
  // and the real answer arrives after hydration.
  const isWebView = useHydrationSafeValue(false, () => Boolean(window.ReactNativeWebView));

  const postMessage = useCallback((message: WebViewMessage) => {
    window.ReactNativeWebView?.postMessage(JSON.stringify(message));
  }, []);

  return { isWebView, postMessage };
}
