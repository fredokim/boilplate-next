/**
 * One wake-up attempt at a time, however many requests find the server asleep.
 *
 * A free instance sleeps after fifteen minutes and takes about twenty seconds
 * to come back. Opening a page sends four things at once -- three widget
 * queries and a socket handshake -- and the platform answers a burst aimed at a
 * sleeping service by refusing to wake it at all: every request comes back
 * `429 Too Many Requests`, and it stays that way long after the burst.
 *
 * A single patient request wakes it. So the first failure closes this gate, one
 * probe waits for the server, and everything else waits on that probe instead
 * of adding to the pile. Nothing here keeps the server awake -- holding a free
 * instance up would spend the month's hours in about eight days.
 */

/** Attempts before giving up, so a server that is down does not queue forever. */
const MAX_ATTEMPTS = 20;
const RETRY_DELAY_MS = 3_000;

/**
 * Deliberately not `/api/health`.
 *
 * This app answers that one itself, in a route handler that never touches the
 * backend, so a probe against it would report "awake" while the backend was
 * still asleep. `/api/auth/session` is proxied, and any answer from it -- 401
 * included -- proves the backend replied.
 */
const PROBE_PATH = "/api/auth/session";

/** The platform's refusal to wake a sleeping service. Not an answer from the API. */
export const ASLEEP_STATUS = 429;

export class ServerWakeGate {
  private probe: Promise<void> | null = null;

  constructor(
    private readonly check: () => Promise<boolean>,
    private readonly retryDelayMs: number = RETRY_DELAY_MS,
    private readonly maxAttempts: number = MAX_ATTEMPTS,
  ) {}

  /** True while a probe is outstanding, so the interface can say what it is waiting for. */
  get isWaking(): boolean {
    return this.probe !== null;
  }

  /**
   * Resolves immediately unless a probe is running.
   *
   * Callers put this before their request. In the ordinary case it costs
   * nothing: the gate only closes once something has actually seen a 429.
   */
  async wait(): Promise<void> {
    if (this.probe) await this.probe;
  }

  /** Starts the one probe. Later reports join it rather than starting another. */
  reportAsleep(): void {
    this.probe ??= this.run().finally(() => {
      this.probe = null;
    });
  }

  private async run(): Promise<void> {
    for (let attempt = 0; attempt < this.maxAttempts; attempt += 1) {
      if (await this.check()) return;
      await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs));
    }
  }
}

/** Any status but the platform's refusal means the backend answered. */
async function probeServer(): Promise<boolean> {
  try {
    const response = await fetch(PROBE_PATH, { method: "GET" });
    return response.status !== ASLEEP_STATUS;
  } catch {
    return false;
  }
}

export const serverWakeGate = new ServerWakeGate(probeServer);
