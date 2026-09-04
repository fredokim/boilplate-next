# Visual Graph Feature

Reference for `src/features/visual-graph`, this repo's largest worked example. It exists
to show how a non-trivial, interaction-heavy feature lives in the App Router without
dragging the whole page across the client boundary.

Route: `/examples/graph` — a server component that renders one client container.

## What is shared with the other boilerplates

This feature was ported from the React boilerplate, and 33 of its 43 modules moved
across **unchanged**. The only edit was one line: Vite's `import.meta.env.DEV` became
`process.env.NODE_ENV` in `performance/performanceMetrics.ts`.

Everything under `model/`, `editing/`, `layout/`, `network/`, `performance/`,
`realtime/` (except the hook), and `services/` is plain TypeScript with no React import.
The same files exist in the React and Vue boilerplates. When changing one, decide first
whether the change belongs in that shared logic or in the Next layer above it.

## Layer map

| Directory | Owns | React? | Client? |
| --- | --- | --- | --- |
| `model/` | Graph document, selection, interaction state, visual-state derivation | No | — |
| `editing/` | Undoable edit session, commands, clipboard, validation, serialization | Hook only | — |
| `layout/` | Layout engines, dagre service, worker executor, stale-response coordinator | No | — |
| `network/` | Demo topology, large topology, route fixtures, realtime wiring | No | — |
| `realtime/` | Transport, runtime store, controller, mock source, `useTopologyRealtime` | Hook only | — |
| `performance/` | Search index, detail-level adapter, deterministic fixtures, measurement | No | — |
| `services/` | Route service interface and mock implementation | No | — |
| `components/` | `GraphCanvas` (React Flow adapter) and `GraphNodeCard` | Yes | Yes |
| `views/` | `GraphViewerView`, `GraphEditorView`, stories | Yes, props-only | Yes |
| `containers/` | `GraphViewerContainer` — the single client boundary | Yes | **`"use client"`** |

## The client boundary

There is exactly one `"use client"` directive in this feature, at the top of
`containers/GraphViewerContainer.tsx`. Everything it imports becomes part of the client
bundle automatically, so the views, components, and hooks below it need no directive of
their own.

`src/app/examples/graph/page.tsx` stays a server component. It renders the container and
supplies `metadata`. The route still prerenders as static content — the server produces
the full topology markup, and the client takes over on hydration.

That works only because nothing in the render path reads a browser API:

- `createWorkerLayoutExecutor()` checks `typeof Worker === "undefined"` and falls back to
  main-thread dagre, so the `useRef` initialiser is safe on the server.
- The runtime store starts empty, so the first paint shows `unknown` status everywhere
  and no timestamps. Real values arrive after the snapshot resync, post-hydration.
- Node ids are only minted on interaction, never during render.

## Styling

The React original used Tailwind utilities plus a global stylesheet. Here everything is
CSS Modules over the tokens in `src/styles/tokens`.

One detail is easy to get wrong: React Flow composes some class names at runtime from
strings we build. Under CSS Modules those names are hashed, so the strings must be built
from module bindings, not literals:

```ts
className: [visualState.dimmed ? styles.edgeDimmed : "", ...].join(" ")
```

Rules that target React Flow's own elements (`.react-flow__edge`, `.react-flow__controls`)
are wrapped in `:global()` and scoped under `.canvas` so they do not leak.

## Realtime pipeline

Runtime health is **not** part of the graph document. `networkGraph` describes topology;
status and metrics arrive separately as a stream. A node whose realtime state never
arrives renders as `unknown` rather than blocking the topology from drawing.

```
transport ──events──▶ store.enqueue ──coalesce──▶ [pending]
                                                    │ flush timer (50ms / 250ms hidden)
                                                    ▼
                          store.flush ──▶ snapshot ──▶ useSyncExternalStore ──▶ view
controller ──resync──▶ store.applySnapshot
```

`TopologyRuntimeStore` exposes `subscribe`/`getSnapshot`, which is what
`useSyncExternalStore` consumes. The store itself is framework-agnostic; only
`realtime/useTopologyRealtime.ts` knows about React.

### Correctness rules

These are the properties the realtime tests defend:

- **Ordering.** Every entity carries a monotonic `sequence`. An event at or below the
  applied sequence is dropped as stale — checked on enqueue and again on flush, because
  a resync can land in between.
- **Duplicates.** `eventId` is remembered in a bounded LRU (5,000). Redelivery is counted
  and discarded.
- **Coalescing.** Pending events are keyed by `entity:id:kind`, so a burst of metric
  updates collapses to the newest while a status change for the same entity survives.
- **Backpressure.** The pending map is capped (2,000); overflow drops the oldest and
  increments `dropped`, which the debug panel shows rather than hiding.
- **Batching.** The store flushes on a timer, not per event — 50ms visible, 250ms hidden.
  One React render per flush regardless of event rate.
- **Unknown entities.** Events for ids absent from the graph are counted and ignored.
- **Reconnect.** Exponential backoff with jitter (0.8×–1.2×) up to 30s.
- **Resync races.** `resync()` stamps a generation before awaiting and discards its result
  if a newer resync or a `stop()` happened meanwhile.
- **Subscribe before snapshot.** `start()` subscribes before loading the snapshot;
  sequence checks then preserve deltas that arrive during the load.

`runtime.diagnostics` counts each of these. If a number climbs unexpectedly, it names the
rule that fired.

## Editing

`editing/graphEditorSession.ts` models edit mode as a discriminated union rather than an
`isEditing` boolean: a session is either viewing or editing. A draft with no edit mode, or
undo history while viewing, is unrepresentable.

- Commands are pure `(graph, args) => { graph, changed, error? }`. `changed: false` is how
  a no-op is reported.
- History is capped at 50 entries.
- Structural validation is synchronous and local; `NetworkValidationService` is async and
  injectable, so a real backend check can replace the mock.
- Export is versioned; import validates with Zod and returns `{ success: false, errors }`
  rather than throwing.
- The id factory and repository are injected, which is what makes the editor deterministic
  under test.

## Layout

Automatic layout goes through dagre in a Web Worker:

`layoutCoordinator` → `createWorkerLayoutExecutor()` → `layout.worker.ts` → positions.

Turbopack supports `new Worker(new URL(...), { type: "module" })`, so the worker builds
without configuration. Two failure paths are handled: if `Worker` is undefined or the
worker errors, `fallbackLayoutExecutor` runs dagre on the main thread. The coordinator
tags each request so a slow layout resolving after a newer one returns `{ status: "stale" }`
instead of snapping the graph back.

## Performance

- `graphSearchIndex` builds a flat id/label/metadata index once per graph; the viewer
  searches it behind `useDeferredValue`.
- `graphViewAdapter` derives a detail level from zoom (compact under 0.65, detailed over
  1.2). Compact hides type labels and runtime badges; edge labels drop past 1,000 edges.
- `GraphNodeCard` is memoized with an explicit comparator, which matters when a metric
  burst touches hundreds of nodes.
- `largeGraphFixture` generates deterministic 50 / 500 / 2,000-node graphs.

## Tests

45 tests across the feature. The two container specs are the interesting ones:

- `GraphViewerContainer.test.tsx` mocks the canvas and the realtime hook to test routing,
  selection, and edit-mode orchestration.
- `GraphViewerContainer.realtime.test.tsx` mounts the **real** container under
  `StrictMode` with no realtime mock and asserts the controller connects, resyncs every
  node and edge, and applies streamed deltas through the flush timer with zero unknown
  entities.

## Extending it

- **Real backend.** Replace `MockTopologyTransport` with `WebSocketTopologyTransport`,
  passing a socket factory. Nothing above the transport changes.
- **Real snapshots.** Swap `loadSnapshot` for a route handler or server action returning
  `TopologyRuntimeSnapshot`.
- **Real persistence, validation, routing.** Implement `GraphRepository`,
  `NetworkValidationService`, `GraphRouteService`.

Each is a constructor argument or container prop, not an import to rewrite.

## Open question: realtime wiring across boilerplates

The store, controller, and transport are identical in all three boilerplates. The wiring
above them is not: React and Next use `useSyncExternalStore`, Vue pushes snapshots into a
`shallowRef`. Whether that adapter should be unified — and where a server-rendered
framework should start the stream at all — is still open. It is deliberately not
prescribed here.
