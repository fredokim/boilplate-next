import { describe, expect, it, vi } from "vitest";

import { hasBeenRetried, markRetried, RefreshSingleFlight } from "./refreshSingleFlight";

describe("RefreshSingleFlight", () => {
  it("performs one refresh however many callers arrive together", async () => {
    let resolveRefresh: (token: string) => void = () => {};
    const refresh = vi.fn(
      () =>
        new Promise<string | null>((resolve) => {
          resolveRefresh = resolve;
        }),
    );
    const flight = new RefreshSingleFlight(refresh);

    // Five requests 401 on the same expired token, as a page load does.
    const callers = [flight.run(), flight.run(), flight.run(), flight.run(), flight.run()];

    expect(refresh).toHaveBeenCalledTimes(1);

    resolveRefresh("new-token");

    expect(await Promise.all(callers)).toEqual(Array<string>(5).fill("new-token"));
  });

  it("starts a fresh attempt after the previous one settles", async () => {
    const refresh = vi.fn(() => Promise.resolve<string | null>("token"));
    const flight = new RefreshSingleFlight(refresh);

    await flight.run();
    await flight.run();

    // A settled failure must not be re-awaited forever, so the promise is
    // cleared rather than cached.
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("reports a failed refresh as null rather than throwing", async () => {
    const flight = new RefreshSingleFlight(() => Promise.resolve(null));

    expect(await flight.run()).toBeNull();
    expect(flight.isRefreshing).toBe(false);
  });
});

describe("retry flag", () => {
  it("marks a config so one failure cannot loop", () => {
    const config = { url: "/api/users" };

    expect(hasBeenRetried(config)).toBe(false);
    expect(hasBeenRetried(markRetried(config))).toBe(true);
  });
});
