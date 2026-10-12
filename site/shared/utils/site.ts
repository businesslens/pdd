/**
 * The public origin, for the places that need an absolute URL rather than a path.
 *
 * The canonical tag, the share links, the sitemap, the feed, and the emails
 * cannot use `useRequestURL()`: in development that resolves to the worktree's
 * localhost port, and behind the production proxy it resolves to an internal
 * host. Both would publish a URL nobody can open, so the origin is stated
 * rather than observed.
 *
 * It is a constant rather than runtime configuration because it does not vary:
 * a development build still has to emit `pdd-kit.dev` in a canonical tag and
 * a feed entry. `runtimeConfig.public` would also be frozen into the prerendered
 * payload at build time, and would not reach `shared/email.ts` under Maizzle or
 * `server/utils/rss.ts` under Vitest, neither of which runs inside Nuxt.
 *
 * `shared/utils` is auto-imported into both the app and the Nitro server, so the
 * pages, the sitemap, and the feed read one constant. Modules that build outside
 * Nuxt import it by path instead, because neither runner applies the auto-import
 * transform.
 */
export const SITE_ORIGIN = 'https://pdd-kit.dev'
