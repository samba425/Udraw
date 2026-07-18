# Backend API (optional)

The backend (`backend/`) is a small Fastify service that adds AI diagram
generation and project sync. The editor works fully without it; the frontend
falls back to an offline generator when no backend is configured.

Run it locally with `cd backend && npm run dev` (defaults to
`http://localhost:8787`). Point the frontend at it with `VITE_API_BASE_URL`.

## Security

`app.ts` registers:

- **helmet** — secure response headers.
- **CORS** — restricted to `CORS_ORIGIN` (defaults to the Vite dev server).
- **rate limiting** — `RATE_LIMIT_MAX` requests per `RATE_LIMIT_WINDOW` per IP.
- **body limit** — 5 MB, to bound large-payload DoS.

All request bodies/params are validated with **zod**. Provider secrets stay
server-side and are never returned to the client.

## Endpoints

### `GET /api/health`

```json
{ "status": "ok", "version": "0.1.0", "uptime": 12, "aiProvider": "heuristic", "timestamp": "..." }
```

### `POST /api/ai/generate`

Request:

```json
{ "prompt": "Sign up -> Verify email -> Log in", "maxNodes": 30 }
```

Response:

```json
{
  "source": "heuristic",
  "spec": {
    "title": "...",
    "direction": "TB",
    "nodes": [{ "id": "n1", "label": "Sign up", "kind": "start" }],
    "edges": [{ "from": "n1", "to": "n2" }]
  }
}
```

`source` is `provider` when a configured AI provider produced the spec, otherwise
`heuristic`. The service tries the provider first (if configured) and falls back
to the offline heuristic on any error.

### `POST /api/projects/sync`

```json
{ "id": "project-id", "data": { /* opaque project document */ } }
```

Returns `{ id, revision, updatedAt }`. Last-write-wins into a bounded in-memory
store (a PostgreSQL-backed implementation can replace it behind the same
interface).

### `GET /api/projects/:id`

Returns the stored `{ id, revision, updatedAt, data }`, or `404`.

### `GET /api/projects`

Lists stored project ids with revision metadata (no payloads).

## Configuration (`config.ts`)

| Env var | Default | Purpose |
| --- | --- | --- |
| `HOST` / `PORT` | `0.0.0.0` / `8787` | Bind address. |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed origin(s), comma-separated, or `*`. |
| `RATE_LIMIT_MAX` | `60` | Requests per window per IP. |
| `RATE_LIMIT_WINDOW` | `1 minute` | Rate-limit window. |
| `AI_PROVIDER` | *(empty)* | Enable a provider (OpenAI-compatible). |
| `AI_API_KEY` | *(empty)* | Provider key (server-side only). |
| `AI_MODEL` | *(empty)* | Provider model, e.g. `gpt-4o-mini`. |
| `AI_BASE_URL` | OpenAI chat completions | Override provider endpoint. |

## DiagramSpec contract

`backend/src/diagramSpec.ts` defines the neutral spec (zod schema) shared with
the frontend (`frontend/src/services/ai/diagramSpec.ts`). The frontend
re-validates any spec it receives before building shapes, so a malformed backend
response can never reach the renderer.
