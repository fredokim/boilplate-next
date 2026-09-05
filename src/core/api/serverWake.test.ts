import { afterEach, describe, expect, it, vi } from "vitest";
import { IsString } from "class-validator";
import { ServerWakeGate } from "./serverWake";
import { requestDto } from "./clientApiClient";
import { TypedAppError } from "@/core/result/failure";

class Payload {
  @IsString()
  label!: string;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

/**
 * These exist because of a real outage, not a hypothetical one. Opening a page
 * sent four requests at a sleeping free instance, the host answered the burst by
 * refusing to wake it, and everything stayed `429 Too Many Requests` for twelve
 * minutes. One patient request woke it immediately.
 */
describe("ServerWakeGate", () => {
  it("costs nothing until something reports the server asleep", async () => {
    const check = vi.fn(async () => true);
    const gate = new ServerWakeGate(check);

    await gate.wait();

    expect(gate.isWaking).toBe(false);
    expect(check).not.toHaveBeenCalled();
  });

  it("probes once however many callers find the server asleep", async () => {
    const check = vi.fn(async () => true);
    const gate = new ServerWakeGate(check, 0);

    gate.reportAsleep();
    gate.reportAsleep();
    gate.reportAsleep();
    await Promise.all([gate.wait(), gate.wait(), gate.wait()]);

    expect(check).toHaveBeenCalledTimes(1);
  });

  it("holds callers until the server answers", async () => {
    vi.useFakeTimers();
    let awake = false;
    const gate = new ServerWakeGate(async () => awake, 1_000);
    const order: string[] = [];

    gate.reportAsleep();
    void gate.wait().then(() => order.push("released"));

    await vi.advanceTimersByTimeAsync(3_000);
    expect(order).toEqual([]);

    awake = true;
    await vi.advanceTimersByTimeAsync(1_000);

    expect(order).toEqual(["released"]);
  });

  /** A server that is down rather than asleep must not queue requests forever. */
  it("gives up rather than waiting without end", async () => {
    vi.useFakeTimers();
    const check = vi.fn(async () => false);
    const gate = new ServerWakeGate(check, 1_000, 3);
    let released = false;

    gate.reportAsleep();
    void gate.wait().then(() => {
      released = true;
    });
    await vi.advanceTimersByTimeAsync(10_000);

    expect(check).toHaveBeenCalledTimes(3);
    expect(released).toBe(true);
    expect(gate.isWaking).toBe(false);
  });

  /** Every request in the app waits on this promise. It must not reject them. */
  it("treats a probe that throws as a server still asleep", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const gate = new ServerWakeGate(async () => {
      calls += 1;
      if (calls < 3) throw new Error("connection refused");
      return true;
    }, 1_000);
    let rejected = false;
    let released = false;

    gate.reportAsleep();
    void gate.wait().then(
      () => {
        released = true;
      },
      () => {
        rejected = true;
      },
    );
    await vi.advanceTimersByTimeAsync(5_000);

    expect(rejected).toBe(false);
    expect(released).toBe(true);
  });
});

describe("the API client on a sleeping server", () => {
  /**
   * The host's refusal has no envelope. This app's own 429s -- the login
   * throttle and the chat rate limit -- are JSON like every other answer, which
   * is what tells the two apart.
   */
  it("reads a 429 with no envelope as the server waking, not as an unknown fault", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes("/auth/session")) return { ok: true, status: 200, json: async () => ({}) } as Response;

        return {
          ok: false,
          status: 429,
          json: async () => {
            throw new SyntaxError("Unexpected token 'T'");
          },
        } as unknown as Response;
      }),
    );

    const thrown: unknown = await requestDto({ method: "GET", url: "/api/dashboard/kpi" }, Payload).then(
      () => null,
      (error: unknown) => error,
    );

    expect(thrown).toBeInstanceOf(TypedAppError);
    expect((thrown as TypedAppError).failure.kind).toBe("waking");
  });
});
