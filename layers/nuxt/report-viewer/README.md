# BusinessLens Product Report Workbench

The stable Product Report v10 renderer used by `businesslens view` and exported
from the `businesslens` package. It projects the complete portable report into
an entity-first Workbench: a flat rail of entity kinds, a collection surface per
kind that states its question and opens grouped by the containment the format
declares, a page for every entity, a peek for glancing at one from a list, ⌘K,
and the named topology views.

Depth has two containers and the line between them is a measurement, not a
preference: authored content runs from roughly 570px for an Actor to 2264px for
a Journey Scenario, so the peek stays a fixed glance and the page carries the
reading. A relation in a peek opens a page; it never re-targets the peek.
Authored Capability Context has one dedicated reading in both containers; it is
not repeated as an entity fact. Derived Journey and Scenario Contexts stay with
their concrete routes, Screen placement stays in identity, contextual Rule
selectors stay with applicability, and a Journey shows only its typed starting
places. Raw entry-point routes remain in the report data but are omitted from
the human Workbench.

The report is the sole source of Product identity and content. The separate
`logoSrc` prop resolves the Product's optional `.businesslens/logo.svg`; the
shared `BusinessLensProductLogo` component falls back to a packaged neutral
placeholder. Hosts own navigation and actions outside the report.

The layer renders the report and nothing around it. Site chrome — the header,
the footer, and any brand or legal links — belongs to the host, which already
has the navigation, routing, and legal context the report does not.

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

`report` must be a `ProductReportV10` from `businesslens/report`. There is no
second, lossy public view-model contract.

Two navigation facts are bindable, so a host can keep them in its own router
and give the report deep links, a working back button, and a refresh that lands
where it left:

```vue
<BusinessLensReportViewer
  v-model:section="section"
  v-model:entity="entity"
  :report="report"
/>
```

`section` is `overview`, `topology`, or an entity kind such as `capability`.
`entity` is the stable key of the open entity page (`screen:reader-web::…`), or
`null` for the section's own collection. The peek is deliberately not bindable:
it is a glance, and replaying every glance through browser history would make
back useless.

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
