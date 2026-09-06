# Realtime Integration (Next.js App Router)

How the streaming layer binds to React inside the App Router, what this adapter has to get
right that a client-only React app does not, and what to reach for when adding another
realtime feature.

The same core exists in the React and Vue boilerplates. Each has its own version of this
document, because the core is identical and the binding is not.

## The line that must not move

Everything under `src/features/visual-graph/realtime/` except `useTopologyRealtime.ts` is
plain TypeScript with no React import and no Next import:

| File | Role |
| --- | --- |
| `types.ts` | Wire contract — events, snapshots, connection states |
| `transport.ts` | `TopologyRealtimeTransport` interface, `WebSocketTopologyTransport` |
| `runtimeStore.ts` | Buffering, coalescing, ordering, diagnostics |
| `controller.ts` | Connection lifecycle, flush timer, reconnect, resync |
| `mockTransport.ts`, `graphRuntimeSource.ts` | Development event sources |

All the correctness rules — ordering, duplicate suppression, coalescing, backpressure,
reconnect backoff, resync generation guards — live in the store and controller. Do not
reimplement any of them in a hook. If a rule needs changing, change it there and all three
boilerplates get it.

## What to use

```ts
const runtime = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
```

**Use `useSyncExternalStore`**, for the same tearing reason as the React boilerplate — see
that repo's `REALTIME_INTEGRATION.md` for the argument. Everything in that document about
snapshot identity, flush-driven rendering, and StrictMode idempotency applies here
unchanged.

The rest of this document is what App Router adds.

## The rule that governs everything else

**A stream cannot start on the server.** There is no subscriber, no browser, and no way to
tear it down. Server rendering produces one HTML string and stops.

So the realtime layer has exactly one shape here:

```
server render  →  empty runtime, every node "unknown", no timestamps
hydration      →  same markup, still empty
after mount    →  controller.start() → connect → resync → deltas
```

The whole feature sits under one `"use client"` at
`containers/GraphViewerContainer.tsx`. `src/app/examples/graph/page.tsx` stays a server
component. The route still prerenders as static content, which is only true because
nothing in the render path touches a browser API.

## What this adapter must manage

### 1. Hydration parity

The server and the first client render must produce identical markup. The realtime layer
satisfies this by starting empty on both sides — the store's initial snapshot has no nodes,
no edges, and `lastResync: null`, so nothing time- or environment-dependent reaches the
HTML.

That property is fragile. It breaks the moment a view renders something the server cannot
know. The rules:

- Never read `window`, `document`, `localStorage`, or the transport during render.
- Never format a timestamp that only exists on one side. `lastResync` renders as `—` until
  a resync lands, deliberately.
- If a value genuinely differs between server and client, route it through
  `useHydrationSafeValue` or `useSyncExternalStore` with a distinct `getServerSnapshot`.

The dashboard module hit the other side of this: it read `window.localStorage` inside a
`useMemo`, which crashed the prerender. The fix pattern — server and hydrating client both
start from an empty source, then swap after hydration — is the same one described here.

### 2. Module singletons are per-process on the server

`networkRuntimeSource` is created at module scope. In the browser that is one instance per
tab, which is what you want. **On the server it is one instance per Node process, shared by
every request and every user.**

For this demo that is harmless: it holds fabricated topology data and never runs on the
server, because only a client component imports it. It stops being harmless the moment a
source holds anything request-scoped — a user id, an auth token, a tenant.

The rule: a module-level realtime source may only hold data that is safe to share across
all requests. Anything per-user is created inside the client component, or passed down as a
prop from a server component that resolved it per request.

### 3. `Date.now()` and other moving values at module scope

`createGraphRuntimeSource` calls `Date.now()` when it builds its initial snapshot. That
value never reaches server-rendered HTML today, because the store starts empty and the
source is client-only. If a future change makes a source's initial state render on the
server, that timestamp becomes a hydration mismatch.

Prefer deriving times inside the stream rather than at construction.

### 4. `useSearchParams` opts a route into client rendering

Not used by the graph viewer today, but relevant to any realtime feature keyed on query
state: reading `useSearchParams` makes the route client-rendered unless it sits under a
`Suspense` boundary. Wrap it, or lose the static prerender that makes the first paint fast.

### 5. Page visibility and back/forward cache

The controller drops the flush interval from 50ms to 250ms when `document.hidden` and
resyncs on return. App Router navigations keep client components mounted more often than a
full page load would, so the `visibilitychange` listener must be removed on teardown or a
stale controller survives a route change.

## The open question: where the stream should start

Today the stream starts after hydration. The first paint shows an all-`unknown` topology,
which resolves within a few hundred milliseconds. That is simple and correct, but it is not
the only option:

| Approach | First paint | Cost |
| --- | --- | --- |
| **Start after hydration** (current) | Topology drawn, all status `unknown` | Visible flash of unknown state |
| **Server-fetch the snapshot, pass as prop** | Topology drawn with real status | Snapshot must be serialisable; needs a per-request fetch; store must accept a seed without breaking sequence checks |
| **Stream over SSE from a route handler** | Same as current | Replaces the transport, not the store; no WebSocket infrastructure needed |

The second is the interesting one and is not implemented. It would mean
`loadSnapshot` running on the server, its result serialised into the client component's
props, and the store seeded before `start()`. The sequence guards already handle a snapshot
arriving before deltas, so the machinery exists — what is missing is a decision about
whether the extra request on every page load is worth removing the flash.

This is deliberately unresolved. Do not implement it as a side effect of another change.

## Testing the adapter

Four layers:

1. **Store and controller** — plain unit tests, no React.
2. **SSR safety** — render the component through `renderToString`. It throws if anything
   reads `window` during render. `src/hooks/hooks.test.tsx` uses this for the shared hooks;
   copy the pattern for realtime views.
3. **The real container** — `GraphViewerContainer.realtime.test.tsx` mounts the container
   under `StrictMode` with no realtime mock and asserts the controller connects, resyncs
   every node and edge, and applies streamed deltas with zero unknown entities.
4. **The build** — `npm run build` prerendering `/examples/graph` is itself a test. If a
   realtime change reads a browser API during render, the build fails.

Mock the canvas, not the stream. Mocking the hook proves nothing about the adapter.

## Production signals

`runtime.diagnostics` is the built-in telemetry. Each counter names the rule that fired:

| Counter | Climbing means |
| --- | --- |
| `staleIgnored` | Out-of-order delivery, or a resync racing deltas |
| `duplicatesIgnored` | The transport is redelivering |
| `unknownEntities` | Server knows topology the client does not — refetch the graph |
| `dropped` | Backpressure — the client cannot keep up with the stream |
| `coalesced` | Normal under load; the batching is doing its job |
| `reconnectCount` | Link instability |

Wire these into the adapters in `src/core/observability/` rather than logging from the
view.
