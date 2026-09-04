import "server-only";
import { isServerBacked } from "./backend";
import { dataMode } from "./dataMode";

/**
 * Refuses a configuration where the two switches disagree.
 *
 * `BACKEND_URL` decides what the route handlers do; `NEXT_PUBLIC_DATA_MODE`
 * decides what transport the browser constructs. Set one without the other and
 * the app is half-connected — realtime on mocks while HTTP is live, or the
 * reverse — which looks like working software and is very hard to notice from
 * the UI. Neither value can be derived from the other, because the address must
 * stay off the client, so the only defence is to check they agree.
 */
export function assertDataModeMatches(): void {
  if (isServerBacked === (dataMode === "server")) return;

  throw new Error(
    isServerBacked
      ? "BACKEND_URL is set but NEXT_PUBLIC_DATA_MODE is not \"server\": the browser would use mock transports against a live backend."
      : "NEXT_PUBLIC_DATA_MODE is \"server\" but BACKEND_URL is not set: the browser would open sockets that nothing forwards.",
  );
}
