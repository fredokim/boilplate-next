import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Two checks, because this app sits between the browser and the backend.
 *
 * Everything the browser calls goes to this app's own origin, where a route
 * handler forwards it or a rewrite passes it through. So there are two ways to
 * be wrong, and they fail differently:
 *
 * - a route handler forwards a path the backend does not publish, which 404s
 *   at the far end;
 * - the client calls a path this app does not handle at all, which 404s here.
 *
 * The second is the one that is easy to miss, because everything looks local.
 */

const SPEC_PATH = resolve(__dirname, "../../../contracts/openapi.json");
const APP_DIR = resolve(__dirname, "../../app/api");
const SRC_DIR = resolve(__dirname, "../..");

type OpenApiDocument = {
  paths: Record<string, Record<string, unknown>>;
  components: { schemas: Record<string, { properties?: Record<string, unknown>; required?: string[] }> };
};

const spec: OpenApiDocument | null = existsSync(SPEC_PATH)
  ? (JSON.parse(readFileSync(SPEC_PATH, "utf8")) as OpenApiDocument)
  : null;

const describeIfSpec = spec ? describe : describe.skip;

/**
 * Reduces a path to a comparable shape.
 *
 * Three notations mean the same thing here and none of them agree: a template
 * expression in client code, `{id}` in the OpenAPI document, and `[id]` in a
 * Next route directory. Parameter names are dropped too, since each side names
 * them independently.
 */
function shape(path: string): string {
  return path
    .replace(/\$\{[^}]*\}/g, "{}")
    .replace(/\{[^}]*\}/g, "{}")
    .replace(/\[[^\]]*\]/g, "{}");
}

function walk(dir: string, visit: (path: string, source: string) => void): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full, visit);
      continue;
    }

    if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) continue;
    if (entry.name.includes(".test.")) continue;

    visit(full, readFileSync(full, "utf8"));
  }
}

/** Backend paths the route handlers forward to. */
function forwardedPaths(): string[] {
  const found = new Set<string>();

  walk(APP_DIR, (_, source) => {
    for (const match of source.matchAll(/proxyToBackend\([^,]+,\s*[`"]([^`"]+)[`"]/g)) {
      if (match[1] !== undefined) found.add(shape(match[1]));
    }
  });

  return [...found].sort();
}

/** Paths this app must answer itself: a route handler, or a rewrite. */
function handledPaths(): Set<string> {
  const handled = new Set<string>();

  walk(APP_DIR, (path) => {
    if (!path.endsWith("route.ts")) return;

    // Windows paths use backslashes; the route is a URL either way.
    const relative = path
      .slice(APP_DIR.length)
      .split(String.fromCharCode(92))
      .join("/")
      .replace(new RegExp("/route[.]ts$"), "");

    handled.add(shape(`/api${relative}`));
  });

  const config = readFileSync(resolve(__dirname, "../../../next.config.ts"), "utf8");

  for (const match of config.matchAll(/source:\s*"([^"]+)"/g)) {
    if (match[1] !== undefined) handled.add(shape(match[1]));
  }

  return handled;
}

/** Paths the client asks this app for. */
function clientPaths(): string[] {
  const found = new Set<string>();

  walk(SRC_DIR, (path, source) => {
    if (path.startsWith(APP_DIR)) return;
    if (!source.includes("requestDto") && !source.includes("new WebSocket")) return;

    for (const match of source.matchAll(/url:\s*[`"](\/api\/[^`"]+)[`"]/g)) {
      if (match[1] !== undefined) found.add(shape(match[1].split("?")[0] ?? ""));
    }

    // Socket URLs are built from window.location, so the path is a literal.
    for (const match of source.matchAll(/\$\{window\.location\.host\}(\/api\/[^`"]+)/g)) {
      if (match[1] !== undefined) found.add(shape(match[1]));
    }
  });

  return [...found].sort();
}

describeIfSpec("backend contract", () => {
  it("forwards only paths the backend publishes", () => {
    const published = new Set(Object.keys(spec?.paths ?? {}).map(shape));
    const forwarded = forwardedPaths();

    // A scan that finds nothing would pass forever.
    expect(forwarded.length).toBeGreaterThan(3);

    expect(forwarded.filter((path) => !published.has(path))).toEqual([]);
  });

  it("answers every path the client asks it for", () => {
    const handled = handledPaths();
    const called = clientPaths();

    expect(called.length).toBeGreaterThan(3);

    expect(called.filter((path) => !handled.has(path))).toEqual([]);
  });

  /** The fields this app's auth DTOs validate on arrival. */
  it("matches the auth shapes the DTOs validate", () => {
    const properties = (schema: string) =>
      Object.keys(spec?.components.schemas[schema]?.properties ?? {}).sort();

    expect(properties("AuthUserResponseDto")).toEqual(["email", "id", "name", "permissions"]);
    expect(properties("LoginResponseDto")).toEqual(["accessToken", "user"]);
    expect(properties("SessionResponseDto")).toEqual(["user"]);
  });
});
