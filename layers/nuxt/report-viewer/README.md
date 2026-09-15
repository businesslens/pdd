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
  :report="report"
/>
```

| Model | Value | Default |
| --- | --- | --- |
| `section` | `overview`; a cross-collection view: `delivery`, `what-changes-what`, or `rule-attachments`; or a collection: `entity`, `interface`, `domain`, `capability`, `journey`, or `rule` | `overview` |
| `resource` | the stable key of the open resource page (`screen:reader-web::…`), or `null` for the section's collection | `null` |
| `tab` | page: `overview`, `scenarios`, `lifecycle`; collection: `overview` (Rows) or `graph`; Overview: `overview` (About), `coverage`, or `references` | `overview` |
| `scenarioRoute` | the first route in the visible Scenario route window, or `null` | `null` |
| `routeColumns` | `auto`, or the reader's preferred number of visible route columns | `auto` |
| `topology` | selected view, Journey, Scenario window, matrix column, focus, hidden kinds, expanded/collapsed groups, directory search | Domain map; no filters |

Every one is optional; bind the ones the host wants in its URL. A Scenario key
keeps the parent collection as the section while selecting that Scenario inside
its parent page.

The layer auto-imports `useBlrReportNavigation()` for hosts that use Vue Router.
It returns these six models and encodes `s`, `e`, `t`, `r`, `rc`, plus reading
keys `tv`, `tj`, `ts`, `tm`, `tf`, `th`, `tx`, and `tc`. Set
`useBlrReportNavigation({ sectionKey: 'tab' })` for the catalog's section URLs.
Defaults are omitted; array keys repeat, preserving qualified resource IDs.
Navigation pushes history; reading filters and expansion replace the current entry.
Hosts can instead bind their own state. Collection facets, collapsed groups,
expanded tree nodes, scroll anchors and graph position use session storage when
available, isolated by report and host path. They survive refresh and
recompilation without entering the Product Model; removed facet IDs are pruned.
Two preferences are cookies, so a server-rendered host paints them right on the
first load: `blr-tooltips` (whether term tooltips are drawn) and `blr-columns`
(how many columns each collection's Rows use, keyed by collection, one to
four; rows start at one, tree cards at three). Nothing else is kept, because
nothing else is configurable: the reading and its grouping are decided by the
report rather than auditioned on every visit.

A collection is one set with two drawings, selected with `section` and `tab`
and no resource key. The rail changes the subject, the filters narrow the set,
and a Rows/Graph switch beside the filters changes only how that set is drawn:
the heading count, the filter controls and the chips are the same in both.

| Section | Rows (`overview`) | Graph (`graph`) |
| --- | --- | --- |
| `entity` | one row per Entity, grouped by Domain; Actors lead | Entity relationships |
| `interface` | one tree card per Interface: its Experiences, each with its Screens, and its direct Screens | Interface map |
| `domain` | one tree card per Domain: its Capabilities and its Entities, Unassigned trailing | Domain reach: Domain, then the places its Capabilities are available in, then the Capabilities, Journeys and Rules reached there |
| `capability` | one row per Capability, grouped by Domain | Capability reach: Capability, then its places and Rules |
| `journey` | one row per Journey | Journey reach: Journey, then its places and Rules |
| `rule` | one row per Business Rule, grouped by Domain | Rule reach: Rule, then its attachment targets and Contexts |

The cross-collection matrices are rail rows below Overview, each its own
section with no tabs: `delivery` (Compare delivery, a Capability by Interface
matrix), `what-changes-what` and `rule-attachments`. Their navigation icons,
selection accents and heading icons use neutral colors. Each keeps its own type
narrowing (`th`) and focus (`tf`). A collection Graph
draws the facet-filtered set and honours `tf` as a neighbourhood; branch
expansion uses `tx`/`tc`. Entity Lifecycle keeps its tab, and resource Overview
retains Connections.

Capabilities and Journeys have one Scenarios tab, using expandable cards.
Direct Scenario links open and scroll to the matching card inside its parent.
Scenario cards separate Trigger and Outcome from the Entities they leave behind.
The whole summary, including its title, toggles the ordered Steps followed by
any decision points and edge cases inside the same contained card. The single
expansion control includes the Step and detail counts; there is no separate
details toggle. Resource links and definitions work independently of expansion.
Each Entity appears once in the terminal reading, with its
last creation, change or removal, and Entities only read sit separately.
Scenario titles use 16px semibold text, section labels 13px semibold, and body
text 14px regular. Step cards use the selected Guided flow layout: visible labels for
Action or Condition, Who, Entity effects, Where and Capability, with effects
spelled out in words. Where reuses the original Context breadcrumbs — Interface,
Experience and Screen — without route-name prefixes. The Step card variant
selector has been retired.
Resource pages and the Product Overview share Nuxt UI's link-style tabs on a
transparent header. The host places the resource tab strip above the scroll
pane, so it stays available without a filled sticky backdrop or a nested
scrollbar. Scenarios keeps Expand all, Collapse all and the per-row selector
on the right of that strip. The controls wrap when the screen is too narrow
for one row; tabs retain Nuxt UI's arrow-key navigation and visible focus.
Expand all and Collapse all use diagonal outward and inward arrows across
page and graph toolbars.

Domain and Interface cards are trees inside translucent containers, without a
separate header. Their borderless tree rows fill each card's width and use the
parent's background, with a subtle row highlight on hover. Each group has its
matching resource-type icon. Expansion chevrons sit before
these icons; counts align at the right edge. Resource entries retain
their type marks. The named Domain or Interface is the tree root. Clicking any
branch row, including its name or chevron, only expands or collapses its children;
Enter, Space and arrow keys also control expansion. A resource branch starts
with an icon-free Overview link to its page, including an Experience with Screens.
Resource leaves open their pages directly. Closing a root preserves its folders'
expansion state. Counts exclude Overview links. Unassigned only expands and
collapses and has no Overview link.
Experiences and Screens folders appear in Interfaces only when they contain
items; the same applies to Capabilities and Entities folders in Domains. An
empty Domain or Interface expands to show just its Overview link.
Unassigned appears only when it contains resources.
Scenarios v3 and its table drawing have been retired.

Backgrounds follow the item's role, independently of which levels are visible:

| Role | Examples | Background |
| --- | --- | --- |
| Group | Domain groups in Entities and Capabilities | Translucent `bg-elevated/20` |
| Resource | Entity, Capability, Journey and Scenario cards | Solid `bg-default` |
| Detail | Steps inside a Scenario | Opaque `--blr-bg-detail`: 80% resource background, 20% elevated tone |

Scenarios therefore starts at the resource level and expands to detail-level
Steps. Its summary keeps the soft hover. Step cards and their number markers
use the detail background; the cards keep a steady background and border on
hover, while resource links remain interactive.
The detail tint is half the summary's 40% hover treatment, keeping the third
level subtle and distinct from an interaction highlight in both themes.

There is no URL migration. Every standalone `topology` and named-destination
shape changed with the restructure, and an address naming a destination this
report has no home for opens the Overview rather than landing the reader
somewhere else without saying so. Resource links retain their ids, and
Experience and Screen pages keep Interfaces selected.

Interface map and the four reach graphs follow a containment tree: measured
nodes in horizontal tiers, parents above children, shared orthogonal branches,
and a distinct Product root. A reach graph draws occurrences, so a Screen
reached by three Capabilities appears under each of them.
Vue Flow provides its canvas, resource styling, zoom, and pan. Collapsed branches
show corner count badges, with the expansion choice preserved in the URL.
Expansion, collapse, and Fit smoothly centre the visible graph after layout;
centering is immediate when the reader prefers reduced motion.
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
