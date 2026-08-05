# BusinessLens Nuxt Layers

The OSS Product Report v8 renderer and BusinessLens-wide Nuxt theme used by
`businesslens view` and the public BusinessLens site. Both are exported from
the single `businesslens` npm package.

The supplied report is the sole source of Product identity, title, summary,
description, category, tags, authors, license, statistics, and body content.
The separate `logoSrc` prop resolves the Product's `.businesslens/logo.svg`:
the localhost host serves it from disk and catalog hosts resolve it from source
provenance. The shared `BusinessLensProductLogo` component renders a packaged,
neutral placeholder when no source was supplied or the source cannot load.
Hosts may add navigation, actions, or provenance around the
component, but the renderer intentionally offers no Product-presentation
override that could make a catalog view disagree with the report it delivers.

Extend the report layer from a Nuxt application:

```ts
export default defineNuxtConfig({
  extends: ['businesslens/nuxt/report-viewer']
})
```

Add the sibling BusinessLens theme Layer when the host wants the shared palette,
typography, semantic Nuxt UI mapping, and global interaction foundation:

```ts
export default defineNuxtConfig({
  extends: [
    'businesslens/nuxt/report-viewer',
    'businesslens/nuxt/theme'
  ]
})
```

The consuming Nuxt project has final authority over configuration and CSS. The
report-viewer Layer uses semantic Nuxt UI roles and declares no concrete palette.
It can therefore be consumed without the BusinessLens theme, or styled by a
different design system. The core registers `@nuxt/ui`; a host that omits the
optional theme must provide its own Tailwind/Nuxt UI stylesheet and semantic
color mapping.

Because the Layers are optional subpaths of a CLI package, their Nuxt, Vue,
Nuxt UI, Tailwind, and Fontsource requirements are optional peer dependencies.
The consuming Nuxt project must install the peers used by the Layers it extends.

The theme is not scoped to the report renderer. It is the stable visual
foundation for the complete BusinessLens Nuxt host: palette, typography,
semantic Nuxt UI mapping, selection, scrollbar, and base interaction behavior.
Host CSS still loads later and can override semantic tokens, palette ramps,
page backgrounds, or component `ui` slots without changing this package.
Marketing layout, site chrome, catalog actions, and decorative treatments
remain in the host application.

The pure report projection used by the renderer is available separately from
Nuxt:

```ts
import { projectReportView } from 'businesslens/report/view-model'
```
