# Deployment

## The browser only ever sees this app's origin

The backend lives in [boilplate-server](https://github.com/fredokim/boilplate-server)
and is shared with the React and Vue boilerplates.

Its refresh token is an HttpOnly cookie with `sameSite: 'lax'`. A call made
from the browser straight to the backend would never carry it: sign-in appears
to work, and the session ends without explanation the moment the access token
expires.

So the browser never calls the backend. The route handlers under `src/app/api`
forward instead, and `BACKEND_URL` has no `NEXT_PUBLIC_` prefix so the address
cannot reach the client bundle.

### The access token lives in a cookie too

Not in local storage. The login route captures the token the backend issues and
stores it in an HttpOnly cookie; the proxy attaches it to every forwarded call,
server-side. Nothing in the page holds it, so a script running in this origin
has nothing to steal — and an `Authorization` header arriving from the client
is ignored rather than forwarded, or the token would return by the back door.

The React and Vue boilerplates keep theirs in local storage because they have
no server of their own. This one does.

### WebSockets are the exception

A route handler cannot relay an HTTP upgrade, so `/api/topology` and
`/api/live/chat` are rewritten in `next.config.ts` instead. The browser still
sees this origin, and the cookie travels with the handshake — the backend's
gateways read the access token from it when no query token is present, and
refuse that path unless the `Origin` is one they allow.

---

## Configuration

```bash
# .env.local
BACKEND_URL=http://127.0.0.1:3001
NEXT_PUBLIC_DATA_MODE=server
```

Both, or neither. `BACKEND_URL` decides what the route handlers do and
`NEXT_PUBLIC_DATA_MODE` decides which transport the browser builds; the address
cannot be derived from the public value, so the two are checked against each
other at startup and a mismatch is refused. Setting one alone gives a
half-connected app — realtime on mocks while HTTP is live — which looks like
working software.

With neither set, the route handlers answer from dummy data and no backend is
needed.

---

## What has not been verified

- **Nothing has been deployed.** The app has run against a hosted PostgreSQL
  from a developer machine. No rewrite rule on a real host has been exercised,
  so TLS termination, `TRUST_PROXY` on the backend, and a platform's idle
  timeout on a WebSocket are all untested.
- **Three endpoints stay mock.** `users/count`, `notifications`, and
  `audit-logs` have no counterpart on the backend. Each says so in its handler
  rather than becoming a call that would 404.

---

## A note on testing in a hidden browser

`/examples/graph` is the only route that renders behind a streaming boundary.
In a browser whose document is hidden, `requestAnimationFrame` never fires and
that boundary is never revealed — the page sits on "Loading route" while the
server has already sent the whole thing.

That is a property of the viewer, not of the page: the same URL renders
normally in a visible browser. It cost an afternoon to work out, so it is
written down here. When a page appears stuck, check `document.hidden` before
looking for a bug.
