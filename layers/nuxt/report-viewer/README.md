# BusinessLens Product Report

The stable Product Report v13 renderer used by `businesslens view` and exported
from the `businesslens` package. It projects the complete portable report into
six main resource collections: Entities, Interfaces, Domains, Capabilities,
Journeys, and Business Rules. Overview sits above Resources. Experiences and
Screens are reached through Interfaces, with ownership shown inside their resource readings.

Inline definitions and the Vocabulary panel share a registry generated from
the documentation's `terms:` frontmatter.

A collection row, relation, search result, or topology resource opens one complete
resource slideover. The underlying collection or comparison keeps its heading,
rail selection, Rows/Graph drawing, filters, expansion, scroll and graph viewport.
Desktop readers can continue interacting with that view; narrow screens use a
full-width modal reading. Back restores the previous resource and its tab and
reading position. Close returns to the working view. Resource links support the
browser's new-tab and copy-link actions. The compact header keeps the resource's
identity on the left and named-view and documentation actions beside Close.

Overview contains identity facts, authored detail, Contexts and supporting material,
with contextual links beside the facts they explain. Capability
and Journey readings add Scenarios; an Entity with States adds Lifecycle.
Connections follows whenever relationships exist and gives the complete
relationship list, including links also explained in Overview. References comes
last when attachments exist, with its count, roles and image previews. Attachments
use the same Nuxt UI Tree styling as Domains and Interfaces, grouped by their
authored reference type. Groups start open; image previews expand beneath their
reference. Expansion is remembered per resource across tab changes, Back and
refresh. A Scenario URL selects and
expands that Scenario inside its parent. Named-view actions explicitly change
the working view and close the panel. Ownership remains visible inside the
resource reading and is separate from its return trail. Selecting Connections
from a Scenario reading opens its parent's Connections tab. References stays
scoped to the inspected resource: a Scenario's `rt=references` reads that
Scenario's attachments under its own title.

The Product Overview's References reading uses the same tree for every attachment
in the model, including the Product's own. Each item names its owner, and resource
owner links open that resource's References tab over the current reading. The
catalog keeps its own expansion separately from individual resource trees.
Local References always lead with the file path; a distinct authored title follows
inline as muted context. External References use their authored title with the URL
below it, or the URL alone when untitled. A title identical to the target is not repeated.
Local References open inside the same slideover, with Back restoring the prior
document or resource reading, including scroll and expansion. Close returns to
the working view. The `f` query parameter carries the local preview URL, independent
of the resource and its tab; refresh and browser Back/Forward preserve the reading.
External HTTP(S) References show an external-link icon and open in a new tab.
Code References use `/_businesslens/code?target=<encoded-target>#reference`.
The local viewer returns structured preview data and renders source with Nuxt UI
Prose components, Shiki syntax colors in both themes, line numbers, and highlights
an authored line range or the first textual match for a symbol (trying its final
qualified name when the full name is not present). Missing locators are explained
beside the file. This endpoint serves only exact Code Reference targets in the
current workspace report, from regular UTF-8 files up to 2 MiB inside the repository;
symlinks and binary files are refused. Source bytes stay outside the Product Report.
Hosts serving workspace reports must provide this endpoint alongside the local
asset mount; portable reports have no Code References.
The asset mount renders `.md`
files as documents with headings, tables, lists, code blocks and heading anchors;
frontmatter stays in a collapsed Document metadata section. View source adds
`?raw=1` to the same URL. Relative links and images resolve from the document's
directory within the repository; linked Markdown uses the same preview. Raw HTML
is displayed as text and executable URLs are refused. Markdown previews share
the source preview's 2 MiB UTF-8 limit, repository boundary and symlink guard.
The local server parses Markdown with Comark, with HTML and component plugins
disabled, and colors code blocks with Shiki. Only standard Markdown elements and
validated presentation attributes reach the Vue reader. Source and Markdown
previews return JSON; direct browser visits open the report slideover. The reader
uses Nuxt UI Prose components, intercepts local links for report navigation, and
inherits the report theme. Parsing and language grammars stay on the server.
Unknown languages and large grammar inputs remain readable as plain text.
Images and plain text open in the same reading; PDF uses the browser's local viewer.

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
  v-model:resource-tab="resourceTab"
  v-model:scenario-route="scenarioRoute"
  v-model:route-columns="routeColumns"
  v-model:topology="topology"
  :report="report"
/>
```

| Model | Value | Default |
| --- | --- | --- |
| `section` | `overview`; a cross-collection view: `delivery`, `what-changes-what`, or `rule-attachments`; or a collection: `entity`, `interface`, `domain`, `capability`, `journey`, or `rule` | `overview` |
| `resource` | the stable key of the inspected resource (`screen:reader-web::…`), or `null` for the section's collection | `null` |
| `tab` | underlying collection: `overview` (Rows) or `graph`; Product Overview: `overview` (About), `coverage`, or `references` | `overview` |
| `resourceTab` | resource reading: `overview`, `scenarios`, `lifecycle`, `connections`, or `references`; independent of `tab` | `overview` |
| `scenarioRoute` | the first route in the visible Scenario route window, or `null` | `null` |
| `routeColumns` | `auto`, or the reader's preferred number of visible route columns | `auto` |
| `topology` | selected view, Journey, Scenario window, matrix column, focus, hidden kinds, expanded/collapsed groups, directory search | Domain map; no filters |

Every one is optional; bind the ones the host wants in its URL. A Scenario key
selects that Scenario inside its parent reading, or its own References when
requested, while the section stays on the originating working view.

The layer auto-imports `useBlrReportNavigation()` for hosts that use Vue Router.
It returns these seven models and encodes `s`, `e`, `t`, `rt`, `r`, `rc`, plus reading
keys `tv`, `tj`, `ts`, `tm`, `tf`, `th`, `tx`, and `tc`. Set
`useBlrReportNavigation({ sectionKey: 'tab' })` for the catalog's section URLs.
Defaults are omitted; array keys repeat, preserving qualified resource IDs.
Navigation pushes history; reading filters and expansion replace the current entry.
`rt` selects the resource tab independently of the working view's `t`. For example,
`?s=entity&t=graph&e=entity:order&rt=lifecycle` keeps Entity relationships behind
Order's Lifecycle. A resource-only address defaults to its owning collection.
The return trail lives in browser history state, survives reload, and follows
Back/Forward; shared URLs carry the current reading without the sender's trail.
The composable also supplies native resource URLs to descendant viewer links.
Hosts providing their own routing should adopt `resourceTab` independently of
`tab`; uncontrolled embedded readers retain a local return trail.
Hosts can instead bind their own state. Interface delivery expansion is stored per resource, separately from the underlying graph.
Collection facets, collapsed groups,
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
section with no tabs: `delivery` (Compare delivery, Capability rows by Interface
columns), `what-changes-what` (Entity rows by Capability columns), and
`rule-attachments` (Business Rule rows by attachment target columns). Their navigation icons,
selection accents and heading icons use neutral colors. Each keeps its own type
narrowing (`th`) and focus (`tf`). A collection Graph
draws the facet-filtered set and honours `tf` as a neighbourhood; branch
expansion uses `tx`/`tc`. Entity Lifecycle and resource Connections each keep
their own tab and reading position, including after following a link and returning.

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
Resource readings and the Product Overview share Nuxt UI's link-style tabs on a
transparent header. The slideover places the resource tab strip above its scroll
pane, with a subtle upper divider and a full-width lower separator aligned with
the active underline. It stays available without a filled sticky backdrop or a nested
scrollbar. Scenarios keeps Expand all, Collapse all and the per-row selector
on the right of that strip. The controls wrap when the screen is too narrow
for one row. Tabs scroll horizontally when needed, retain Nuxt UI's arrow-key
navigation and visible focus, and bring the selected tab into view after a
refresh or resize.
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
with an icon-free Overview link to its reading, including an Experience with Screens.
Resource leaves open their readings directly. Closing a root preserves its folders'
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
Inspecting an Experience or Screen preserves the originating rail selection.

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

Nuxt, Vue, Nuxt UI, Comark Vue (`@comark/vue`), Tailwind, Vue Flow (`@vue-flow/core` and
`@vue-flow/background`), ELK (`elkjs`), icons, and fonts remain optional
peer dependencies of the CLI package; Nuxt consumers install the UI peers they
use.

Run `node scripts/check-reference-previews.mjs` after building to check Markdown
and source previews in an isolated fixture at desktop and mobile widths.

For browser regression checks, install Playwright Chromium and run
`node scripts/check-topology-diagrams.mjs <CLI viewer URL> [more URLs]` from the
repository root. The publish workflow also runs
`scripts/check-packed-diagrams.mjs` against built npm and pnpm consumers to check
SSR, hydration, worker loading, multiple instances, and navigation from the
actual packed layer.

## Navigation regression checks

Against a running built fixture-shop report, run
`node scripts/check-resource-slideover.mjs <url>` for desktop and mobile
inspection, independent Graph/Lifecycle state, nested Back/Forward, Scenario
position, direct links and keyboard dismissal.
`node scripts/check-resource-references.mjs <url>` covers reference ownership,
counts, previews, browser history and scrolling tabs on desktop and narrow screens.
`node scripts/check-report-navigation.mjs <url>` covers the collections, trees,
filters and named-view exits. Set `BLR_NAV_SCREENSHOTS` to a directory outside
the Product Model to save layout captures.
