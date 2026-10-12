# OAuth from day one, for a single administrator

`pdd-kit.dev` is an anonymous catalog with no user-facing account features, so the only
thing sign-in protects is the admin panel — which one person uses. We chose Better Auth with
GitHub and Google over gating an admin endpoint with the publisher key, because Blueprint
curation and pull analytics should be reachable from the UI rather than from `curl`, and
because adding accounts is cheapest while no user data exists yet.

The first user to register becomes an administrator. The exposure window is between the first
production migration and that sign-in, and it is closed by a runbook step, not by code.

## Consequences

- `/login` is reachable and deliberately unlinked from navigation. A signed-in non-admin can
  favourite Blueprints and nothing else.
- **Outside production, email and password sign-in is also on**, and `pnpm db:seed` creates the
  accounts for it. Verifying the admin panel otherwise means registering a GitHub or Google OAuth
  app first, which is a large tax on a small change. It stays off in production because
  `emailAndPassword` also opens `/sign-up/email` — anonymous registration on a public catalog,
  with no address to verify against.
- The initial consolidated-catalog cutover used a temporary password bootstrap behind a disabled
  Ingress. That cutover is complete. Production now rejects password sign-in and registration in
  code even if either retired environment flag survives in a stale Secret; the existing user
  remains the administrator created during the cutover.
- `/login` offers only the methods the running deployment has, read from the environment per
  request through `/api/sign-in-methods`. The container image is built with no credentials, so a
  build-time answer would be "none" everywhere.
- Sign-in navigates with a **document load**, not a router push. The `/admin` guard is Nitro
  middleware; a client-side navigation would skip it and show a non-admin the surface exists.
- The catalog listing must stay **session-independent**: `/blueprints` renders identically for
  everyone under SSR, and favourites are applied client-side after hydration. Do not move
  favourite state into the server-rendered listing.
