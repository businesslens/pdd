# `report.json` is not edge-cached

`pdd-kit.dev` sits behind Cloudflare. Serving `/api/v1/blueprints/:slug/report.json` with
`cache-control: public, max-age=300` would let Cloudflare answer pulls from the edge, and the
origin would never see them. Pull counts are the one metric no JavaScript analytics can capture
and they cannot be backfilled, so we serve `cache-control: no-cache` instead: every pull
revalidates against the origin, while the `etag` still avoids re-sending an unchanged payload.

## Consequences

- A 304 response is still a pull and is counted as one.
- `businesslens blueprint pull` sends `user-agent: businesslens/<version>` from 0.7.0 so CLI pulls are
  distinguishable from browser fetches.
- Event writes are fire-and-forget; a database problem must never fail somebody's pull.
- Page views are Cloudflare Web Analytics' job, not the events table's.
- Revisit if a Blueprint's volume ever makes origin traffic a problem — at which point
  Cloudflare's logs replace the events table rather than supplementing it.
