import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useBreakpoint } from "./useBreakpoint.client";
import { useWebViewBridge } from "./useWebViewBridge.client";
import { useInfiniteScroll } from "./useInfiniteScroll.client";

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width, writable: true });
}

describe("useBreakpoint", () => {
  afterEach(() => setViewportWidth(1024));

  it("classifies the current viewport", () => {
    setViewportWidth(500);
    expect(renderHook(() => useBreakpoint()).result.current).toBe("mobile");

    setViewportWidth(800);
    expect(renderHook(() => useBreakpoint()).result.current).toBe("tablet");

    setViewportWidth(1400);
    expect(renderHook(() => useBreakpoint()).result.current).toBe("desktop");
  });

  it("updates on resize", () => {
    setViewportWidth(1400);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe("desktop");

    act(() => {
      setViewportWidth(500);
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe("mobile");
  });

  it("renders the server breakpoint without touching window", () => {
    function Probe() {
      return <span>{useBreakpoint("mobile")}</span>;
    }
    // renderToString has no window; reading it during render would throw here.
    expect(renderToString(<Probe />)).toContain("mobile");
  });
});

describe("useWebViewBridge", () => {
  afterEach(() => {
    delete window.ReactNativeWebView;
  });

  it("reports a plain browser when no bridge is present", () => {
    const { result } = renderHook(() => useWebViewBridge());
    expect(result.current.isWebView).toBe(false);
  });

  it("detects the bridge and forwards serialized messages", () => {
    const postMessage = vi.fn();
    window.ReactNativeWebView = { postMessage };

    const { result } = renderHook(() => useWebViewBridge());
    expect(result.current.isWebView).toBe(true);

    result.current.postMessage({ type: "ready", payload: { screen: "dashboard" } });
    expect(postMessage).toHaveBeenCalledWith(JSON.stringify({ type: "ready", payload: { screen: "dashboard" } }));
  });

  it("renders as a plain browser on the server", () => {
    function Probe() {
      return <span>{String(useWebViewBridge().isWebView)}</span>;
    }
    expect(renderToString(<Probe />)).toContain("false");
  });
});

describe("useInfiniteScroll", () => {
  it("returns a sentinel ref and observes it only while enabled", () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe = observe;
        disconnect = disconnect;
        unobserve = vi.fn();
        takeRecords = vi.fn();
        root = null;
        rootMargin = "";
        thresholds = [];
      },
    );

    const { rerender, result, unmount } = renderHook(
      ({ enabled }) =>
        useInfiniteScroll({ enabled, hasNextPage: true, isFetching: false, onLoadMore: () => undefined }),
      { initialProps: { enabled: false } },
    );

    result.current.current = document.createElement("div");
    expect(observe).not.toHaveBeenCalled();

    rerender({ enabled: true });
    expect(observe).toHaveBeenCalledTimes(1);

    unmount();
    expect(disconnect).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
