/**
 * The public origin, for the places that need an absolute URL rather than a path.
 *
 * The canonical tag, the share links, the sitemap, and the feeds cannot use
 * `useRequestURL()`: during `nuxt generate` that resolves to the prerenderer's
 * localhost origin, and in development to the dev server's port. Both would
 * publish a URL nobody can open, so the origin is stated rather than observed.
 *
 * It is a constant rather than runtime configuration because it does not vary:
 * a development build still has to emit `pdd-kit.dev` in a canonical tag and
 * a feed entry, and `server/utils/rss.ts` is also exercised under Vitest, which
 * does not run inside Nuxt.
 *
 * `shared/utils` is auto-imported into both the app and the Nitro server, so the
 * pages, the sitemap, and the feeds read one constant. Modules that also run
 * outside Nuxt import it by path instead, because Vitest does not apply the
 * auto-import transform.
 */
export const SITE_ORIGIN = 'https://pdd-kit.dev'

/**
 * The not-found page's document title. `app/error.vue` sets it in the browser,
 * and `nuxt.config.ts` writes it into the generated `404.html`, which Nuxt emits
 * as an empty shell with no head of its own.
 */
export const NOT_FOUND_TITLE = 'Page not found · pdd-kit'
