# BusinessLens Product Report Workbench

The stable Product Report v8 renderer used by `businesslens view` and exported
from the `businesslens` package. It projects the complete portable report into
an entity-first Workbench with browse, inspect, search, scenario, journey, and
named topology views.

The report is the sole source of Product identity and content. The separate
`logoSrc` prop resolves the Product's optional `.businesslens/logo.svg`; the
shared `BusinessLensProductLogo` component falls back to a packaged neutral
placeholder. Hosts own navigation and actions outside the report.

Extend the layer from a Nuxt application:

```ts
export default defineNuxtConfig({
  extends: ['businesslens/nuxt/report-viewer']
})
```

Render the canonical report directly:

```vue
<BusinessLensReportViewer :report="report" :logo-src="logoSrc" />
```

`report` must be a `ProductReportV8` from `businesslens/report`. There is no
second, lossy public view-model contract.

The Workbench needs a bounded viewport. By default it fills the browser height.
A host with persistent chrome can set `--businesslens-report-chrome` to the
chrome height. The bundled local viewer sets it to `4rem` for its header.

The report viewer extends the stable BusinessLens theme because the promoted
Workbench is the canonical BusinessLens report experience. The theme remains a
separately exported layer for other BusinessLens Nuxt surfaces. Hosts retain
final authority over configuration and CSS.

Nuxt, Vue, Nuxt UI, Tailwind, Vue Flow, Dagre, icons, and fonts remain optional
peer dependencies of the CLI package; Nuxt consumers install the UI peers they
use.
