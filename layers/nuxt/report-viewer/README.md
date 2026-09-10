# BusinessLens Product Report

The stable Product Report v13 renderer used by `businesslens view` and exported
from the `businesslens` package. It projects the complete portable report into
six main resource collections: Entities, Interfaces, Domains, Capabilities,
Journeys, and Business Rules. Overview sits above Resources. Experiences and
Screens are reached through Interfaces, with pages and ownership breadcrumbs.

Inline definitions and the Vocabulary panel share a registry generated from
the documentation's `terms:` frontmatter.

A collection row, relation, search result, or topology resource opens the resource
page directly. The page is the one reading container: it has a URL, a
breadcrumb, the authored body at full width, and browser back navigation.
Overview contains identity facts, authored detail, Contexts, relations,
supporting material, and References. A page has Overview and at most one peer
tab: Capability and Journey pages add Scenarios, and an Entity with States adds
Lifecycle, its machine composed from every Step that moves the thing. A Scenario
URL opens that parent page with the Scenario selected. Connections remain in Overview; contextual actions open the appropriate
named collection reading.

Authored Capability Context has one dedicated Overview reading instead of being
repeated as a resource fact. Derived Journey and Scenario Contexts stay with
their concrete routes, Screen placement stays in identity, contextual Rule
selectors stay with applicability, and a Journey shows only its typed starting
places. Raw entry-point routes remain report data but are omitted from the
human Product Report.

The report is the sole source of Product identity and content. The separate
`logoSrc` prop resolves the Product's optional
`.businesslens/product/logo.svg`; the shared `BusinessLensProductLogo`
component falls back to a packaged neutral placeholder. Hosts own navigation
and actions outside the report.

The layer renders the report and nothing around it. Site chrome — the header,
the footer, and any brand or legal links — belongs to the host, which already
has the navigation, routing, and legal context the report does not.

Extend the layer from a Nuxt application:

```ts
export default defineNuxtConfig({
  extends: ['businesslens/nuxt/report-viewer']
})
```

Wrap the host in Nuxt UI's `UApp` (for its tooltip/overlay providers), then render
the canonical report inside a page:

```vue
<BusinessLensReportViewer :report="report" :logo-src="logoSrc" />
```

`report` must be a `ProductReportV13` from `businesslens/report`. There is
no second, lossy public view-model contract.

Where the reader is, is bindable, so a host can keep it in its own router and
give the report deep links, a working back button, and a refresh that lands
where it left:

```vue
<BusinessLensReportViewer
  v-model:section="section"
  v-model:resource="resource"
  v-model:tab="tab"
  v-model:scenario-route="scenarioRoute"
  v-model:route-columns="routeColumns"
  v-model:topology="topology"
  v-model:scenario-mode="scenarioMode"
  :report="report"
/>
```

| Model | Value | Default |
| --- | --- | --- |
| `section` | `overview`, `entity`, `interface`, `domain`, `capability`, `journey`, or `rule` | `overview` |
| `resource` | the stable key of the open resource page (`screen:reader-web::…`), or `null` for the section's collection | `null` |
| `tab` | page: `overview`, `scenarios`, `lifecycle`; collection: `overview` (List), `map`, `relationships`, `mutations`, `attachments`, `delivery`, or `connections` | `overview` |
| `scenarioRoute` | the first route in the visible Scenario route window, or `null` | `null` |
| `scenarioMode` | `details` or Journey `composition`, within Scenarios | `details` |
| `routeColumns` | `auto`, or the reader's preferred number of visible route columns | `auto` |
| `topology` | selected view, Journey, Scenario window, matrix column, focus, hidden kinds, expanded/collapsed groups, directory search | Domain map; no filters |

Every one is optional; bind the ones the host wants in its URL. A Scenario key
keeps the parent collection as the section while selecting that Scenario inside
its parent page.

The layer auto-imports `useBlrReportNavigation()` for hosts that use Vue Router.
It returns these seven models and encodes `s`, `e`, `t`, `r`, `rc`, `sm`, plus reading
keys `tv`, `tj`, `ts`, `tm`, `tf`, `th`, `tx`, `tc`, and `tq`. Set
`useBlrReportNavigation({ sectionKey: 'tab' })` for the catalog's section URLs.
Defaults are omitted; array keys repeat, preserving qualified resource IDs.
Navigation pushes history; reading filters and expansion replace the current entry.
Hosts can instead bind their own state. Collection facets, grouping, card/table
preferences, collapsed groups, scroll anchors and graph position use session
storage when available, isolated by report and host path. They survive refresh
and recompilation without entering the Product Model; removed facet IDs are pruned.

Collection readings are selected with `section` and `tab`, with no resource key:

| Section | List | Named reading |
| --- | --- | --- |
| `domain` | `overview` | `map`: Domain map |
| `interface` | `overview` | `map`: Interface map; `delivery`: Compare delivery |
| `entity` | `overview` | `relationships`: Entity relationships |
| `capability` | `overview` | `mutations`: What changes what |
| `rule` | `overview` | `attachments`: Rule attachments |
| `journey` | `overview` | Composition lives in a Journey's Scenarios |

Interfaces List shows actual ownership, including direct and shared Screens.
Directory search uses `tq`, type narrowing uses `th`, and expansion uses `tx`/`tc`.
Resource links open their subject collection's reading with explicit scope.
Journey composition remains inside Scenarios; Entity Lifecycle keeps its tab.
Interface Overview retains delivery, and resource Overview retains Connections.
Domain map groups both Capabilities and Entities, including Unassigned; it does
not imply containment or dependencies. Interface access belongs to delivery.

Original `topology` section URLs and later standalone named destinations migrate
to these collection readings. Old Experience/Screen collection links open the
Interfaces directory filtered to that type. Resource links retain their ids;
Experience and Screen pages keep Interfaces selected. Existing view ids remain
accepted, including `product-map` for Domain map.

Interface map follows a containment tree: measured nodes in horizontal tiers,
parents above children, shared orthogonal branches, and a distinct Product root.
Vue Flow provides its canvas, resource styling, zoom, and pan. Deeper branches
retain their counts and expand in place, with the choice preserved in the URL.
The renderer never runs Diagram Design or generates model-controlled HTML.
HTML readings remain available while graph geometry loads. A locally bundled
ELK worker arranges Entity relationships and Lifecycle; it loads on demand and
its returned routes and label positions are drawn by Vue Flow. Layout uses the
measured dimensions of the rendered cards and labels. Hover never rearranges the
graph; resizing preserves zoom, and Back and refresh restore the viewport.
The initial fit is capped at actual size; narrow screens retain a minimum zoom
and allow panning, with an explicit Fit control for the complete graph.
See [third-party notices](THIRD_PARTY.md).

The Product Report needs a bounded viewport. By default it fills the browser
height. A host with persistent chrome can set `--businesslens-report-chrome`
to the chrome height. The bundled local viewer sets it to `4rem` for its
header.

The report viewer extends the stable BusinessLens theme because the Product
Report is the canonical BusinessLens report experience. The theme remains a
separately exported layer for other BusinessLens Nuxt surfaces. Hosts retain
final authority over configuration and CSS.

Nuxt, Vue, Nuxt UI, Tailwind, Vue Flow (`@vue-flow/core` and
`@vue-flow/background`), ELK (`elkjs`), icons, and fonts remain optional
peer dependencies of the CLI package; Nuxt consumers install the UI peers they
use.

For browser regression checks, install Playwright Chromium and run
`node scripts/check-topology-diagrams.mjs <CLI viewer URL> [more URLs]` from the
repository root. The publish workflow also runs
`scripts/check-packed-diagrams.mjs` against built npm and pnpm consumers to check
SSR, hydration, worker loading, multiple instances, and navigation from the
actual packed layer.
