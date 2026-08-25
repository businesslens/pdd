# BusinessLens theme

The stable BusinessLens visual foundation: the approved palette, type, brand
identity, and icon family shared by every BusinessLens Nuxt surface.

It is not a report layer. The Product Report extends it because the report is
the canonical BusinessLens experience, but the theme is exported separately so
any BusinessLens host — a landing page, a catalog, an internal tool — renders
identical chrome without pulling in the renderer.

Extend it from a Nuxt application:

```ts
export default defineNuxtConfig({
  extends: ['businesslens/nuxt/theme']
})
```

## What it supplies

- **Semantic colors**, mapped in `app.config.ts` onto Nuxt UI's roles:
  `primary` is brass, `secondary` terracotta, `neutral` umber, with the
  conventional success, info, warning, and error hues. Address them by role,
  never by hue — a host that writes `brass` re-skins itself the next time the
  identity moves.
- **Type**: Archivo and Inter variable faces plus IBM Plex Mono at 400 and 500,
  loaded through `@fontsource`, with `app/assets/theme.css` carrying the scale.
- **`<BusinessLensBrand>`** — the approved mark and wordmark lockup. It
  requests only the asset for the active color mode; painting both twins and
  hiding one with CSS downloads two 111 KB wordmarks on every page.
  `compactOnMobile` drops the wordmark on narrow viewports and keeps the mark
  as the home link.
- **`useBusinessLensThemeHead()`** — registers the browser and install icon
  family from `public/brand/icons`, including the manifest and Apple touch
  icon. Call it once in the host's root component.
- **Nuxt UI defaults**: `size: 'sm'` and `color: 'primary'`.

Nuxt, Vue, Nuxt UI, Tailwind, icons, and fonts are optional peer dependencies
of the `businesslens` package; install the ones your host uses. Hosts retain
final authority over configuration and CSS.

Backgrounds and their audition controls are not here. They live in the optional
`businesslens/nuxt/theme-lab` layer until one is selected and promoted.
