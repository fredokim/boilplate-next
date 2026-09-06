# API Contract

All API responses use this envelope:

```json
{
  "success": true,
  "data": {}
}
```

Errors use:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication is required."
  }
}
```

Route handlers under `src/app/api` build both shapes with `createApiSuccess` and
`createApiError` from `src/core/mock/dummyData.ts`, so the mock backend and a real one
are interchangeable from the client's point of view.

## Two clients, one contract

This app fetches from two places, so there are two clients that validate identically:

- `src/core/api/serverApiClient.ts` runs in server components and route handlers. It is
  marked `server-only`, so importing it from a client component is a build error.
- `src/core/api/clientApiClient.ts` runs in the browser. It calls `fetch` against the
  same `/api` paths and parses the same envelope.

Both build the envelope DTO with `createApiEnvelopeDto(DataDto)` and run it through
`parseDto`, so a response that fails validation raises the same `TypedAppError`
regardless of which side made the request.

## Failure classification

- `origin: "frontend-contract"` — the response did not match the DTO. Our contract is
  wrong, or the backend changed shape.
- `origin: "backend"` — the envelope reported `success: false`, or the body was not JSON.
  `kind` narrows to `unauthorized` when the error code is `AUTH_REQUIRED`.
- `origin: "network"` — `fetch` rejected, so the request never produced a response.

`toFailure` in `src/core/result/failure.ts` normalises anything thrown into an
`AppFailure`, which is what the UI's error states render.

## Adding an endpoint

1. Add the DTO next to the feature that consumes it.
2. Add the payload to `src/core/mock/dummyData.ts`.
3. Add a route handler under `src/app/api/{path}/route.ts`.
4. Register it in `src/core/mock/mockRegistry.ts` so the automation check sees it.
5. Add a scenario in `src/test/msw/scenarios.ts` when tests need to vary the response.
