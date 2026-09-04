/**
 * Whether the client-side code talks to the real backend.
 *
 * This is a boolean, not the backend's address — `NEXT_PUBLIC_` values are
 * inlined into the browser bundle, and the address must not be. What the
 * browser needs to know is only which transport to construct; every request
 * still goes to this app's own origin.
 *
 * Two switches is two ways to end up half-connected, so `assertDataModeMatches`
 * on the server rejects a build where this disagrees with BACKEND_URL.
 */
export type DataMode = "mock" | "server";

const raw: unknown = process.env.NEXT_PUBLIC_DATA_MODE;

function resolve(): DataMode {
  if (raw === "server") return "server";
  if (raw === "mock" || raw === undefined || raw === "") return "mock";

  // A typo must not silently mean "mock". Failing is loud and immediate;
  // falling back would be neither.
  const received = typeof raw === "string" ? `"${raw}"` : typeof raw;

  throw new Error(`NEXT_PUBLIC_DATA_MODE must be "mock" or "server". Received: ${received}`);
}

export const dataMode: DataMode = resolve();

export const isServerData = dataMode === "server";
