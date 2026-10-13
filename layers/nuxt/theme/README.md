# pdd-kit theme

The stable pdd-kit visual foundation: the approved palette, type, brand
identity, and icon family shared by every pdd-kit Nuxt surface.

It is not a report layer. The Product Report extends it because the report is
the canonical pdd-kit experience, but the theme is exported separately so
any pdd-kit host — a landing page, a catalog, an internal tool — renders
identical chrome without pulling in the renderer.

Extend it from a Nuxt application:

```ts
export default defineNuxtConfig({
  extends: ['@itai-gendler/pdd-kit/nuxt/theme']
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
- **`<PddKitBrand>`** — the approved mark beside the PDD-KIT wordmark. It
  requests only the assets for the active color mode; painting both twins and
  hiding one with CSS downloads both on every page.
  `compactOnMobile` drops the wordmark on narrow viewports and keeps the mark
  as the home link. `wordmarkHeight` scales the complete lockup proportionally
  for compact hosts, defaulting to 26 pixels. `markOnly` keeps just the mark
  when the host navigation is collapsed.
- **`usePddKitThemeHead()`** — registers the browser and install icon
  family from `public/brand/icons`, including the manifest and Apple touch
  icon. Call it once in the host's root component.
- **`usePddKitStoredPreference(key, fallback, parse)`** — a reader preference
  kept in local storage and shared by every caller on the page. pdd-kit sets no
  cookies: a prerendered page hydrates with `fallback` and applies the stored
  value once hydration finishes, while a client-only host reads it before the
  first paint. `parse` rejects stored values it does not recognize.
- **`onPddKitPreferenceChange(listener)`** — called with each preference the
  reader changes, for a host whose origin changes between visits. The local
  viewer uses it to keep preferences across runs on new ports.
- **Nuxt UI defaults**: `size: 'sm'` and `color: 'primary'`.
- **Dark mode is off.** The `darkMode` constant in `nuxt.config.ts` is `false`
  until dark mode reads as well as light
  ([#70](https://github.com/itai-gendler/pdd-kit/issues/70)). While it is false, the
  document carries `data-color-mode-forced="light"` and a global route
  middleware forces every page to light, so a stored dark preference never
  paints. Hosts hide their color-mode toggles behind
  `useAppConfig().pddKit.darkMode`. The dark tokens, utilities and logo
  twins stay in place for when it returns.
- **Neutral badges** use Sand: a parchment fill and warm outline in light mode,
  with a subdued brown fill in dark mode. Outline, soft and subtle badges share
  `--pdd-kit-badge-bg`; Product Report filter and resource-link chips use
  the same token. Colored badges retain their semantic palettes.

Nuxt, Vue, Nuxt UI, Tailwind, icons, and fonts are optional peer dependencies
of the `pdd-kit` package; install the ones your host uses. Hosts retain
final authority over configuration and CSS.

Backgrounds and their audition controls are not here. They live in the optional
`pdd-kit/nuxt/theme-lab` layer until one is selected and promoted.
