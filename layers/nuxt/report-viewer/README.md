# BusinessLens Product Report

The stable Product Report v16 renderer used by `businesslens view` and exported
from the `businesslens` package. It projects the complete portable report into
six main resource collections: Entities, Interfaces, Domains, Capabilities,
Journeys, and Business Rules. Overview sits above Resources. Experiences and
Screens are reached through Interfaces, with ownership shown inside their resource readings.

Inline definitions and the Vocabulary panel share a registry generated from
the documentation's `terms:` frontmatter.

A collection row, relation, search result, or topology resource opens one complete
resource slideover. The underlying collection or comparison keeps its heading,
rail selection, Rows/Graph/Matrix drawing, filters, expansion, scroll and graph viewport.
The modal reading dims and blocks the underlying view; narrow screens use the
full width. Expand fills the window with the same resource reading; Restore
returns to the panel width while retaining the drawing, selection and viewport.
Back restores the previous resource and its tab and reading position.
Close, Escape or a click outside returns to the preserved working view. Resource links support the
browser's new-tab and copy-link actions. The compact header keeps the resource's
identity on the left and named-view actions beside Expand and Close.
Related Domains appear as linked names with their type icons in every resource
header, keeping that context visible across tabs and separate from ownership.
The first Domain always appears by name; any remaining Domains open from a
`+N more` button. A single Domain needs no overflow button. The same first Domain
stays visible at every panel width, with an ellipsis for a long name when space
is tight and its full name available on hover. The popover preserves normal resource links;
Escape dismisses it before the resource reading.
Entities and Capabilities show their assigned Domain; other resources show the
Domains reached through their Capabilities or Rule targets. A Scenario uses its
own Capabilities, so it does not borrow Domains from its parent's other cases.

Overview contains identity facts, authored detail, Contexts and supporting material,
with contextual links beside the facts they explain. Capability
and Journey readings add Scenarios.
Interfaces have an Experiences & Screens tab; Experiences have a Screens tab.
Both use the collection's tree rows, chevrons, resource links and expansion
controls. The selected resource is already named in the header, so each tree
starts with its children. Shared Screens occur once under their Interface in the
full tree; an Experience's Screens tab shows shared references with “From” and
an owner link. These tabs hold containment and availability; Overview holds
audience and Connections holds capability exposure. Screens have no containment tab.
An Entity's Overview contains Information
kept; its Lifecycle reading switches between Rows and Graph. Rows groups changes
under their starting State, using the collection list's parent/child styling.
Each State carries its definition, including States with no outgoing changes.
Creation and changes without a starting State have separate groups. Groups and
changes expand and collapse individually or together, with expansion remembered.
Rows expand each change's Capabilities, Rules, co-effects and supporting
Scenarios. Graph nodes and edges open those details in a local inspector;
selecting a State explains it and lists the Scenarios that leave the Entity
there. Changes without specified states remain accessible beside the graph.
The inspector sits below the drawing in a narrow panel and beside it when
there is room. Drawing, selection and viewport survive tab changes, linked
resource lookups and refresh.
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
catalog starts collapsed, with Expand all and Collapse all controls beside its
count that also toggle image previews. It remembers its own expansion separately
from individual resource trees.
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
has the navigation, routing, and legal context the report does not. The report's
sidebar holds search, Vocabulary and sections, with Overview as the way home.
A Product picker below the host brand shows the current Product's logo and name.
It uses Nuxt UI's DropdownMenu with keyboard navigation and a selected-item check.
The trigger uses the selected Hairline treatment: a faint outline and transparent
background. Menu rows center the logo, Product name and checkmark vertically.
The local viewer lists its single Product. Hosts can supply `products` as
`{ label, to, logoSrc?, active? }[]`, marking the current destination `active`;
the current report remains the selected entry even while the host's list loads.
Other entries are native links, with the menu's keyboard type-ahead navigation.
Hosts can supply `productCatalog: { label, to }` to add a link to the full
catalog below the Product choices, separated from them by a divider.
Catalog hosts should key the viewer by Blueprint identity so switching Products
starts a fresh reading. In the collapsed rail, the picker shows a 17px Product
logo in a 32px trigger and a name tooltip; the mobile drawer keeps its full label.
An icon-only Search button sits beside Overview, stacking directly below it
when collapsed. Navigation rows are 36px high with 4px gaps, starting 20px below
the Product picker. Whitespace and the Resources label separate the navigation
groups. Vocabulary leads the bottom reference group above Documentation and
GitHub, with one divider above the whole group.
Hosts with Vocabulary in their own header can set `sidebarVocabulary` to
`false` to omit the sidebar entry and its empty reference group. That header
must keep the Vocabulary panel's tooltip controls available for report readers.
The working view's header serves as its navbar: the heading shares it with
report schema version and
generation date, above a bottom divider. A host's `status` slot replaces the
generation date with its live connection state. Header metadata wraps onto a second line
on narrow screens.
Hosts can supply `sidebar-header` and `sidebar-footer` slots for branding and
utilities; both also appear in the mobile navigation drawer. The bundled local
viewer places its version beside the brand in the sidebar header, followed by
an icon-only Theme lab button and the color-mode switch at the right edge,
aligned with Search. Header controls stack below the mark when collapsed.
Documentation and GitHub stay in the sidebar footer. There is no
separate host navbar; the theme lab bar appears above the report only when
opened. Desktop navigation uses Nuxt UI's
`DashboardSidebar` and `DashboardSidebarCollapse`, expanding to 288px or
collapsing to a 64px icon rail. The choice is saved in a cookie. Navigation and
utility icons keep accessible labels and tooltips; the mobile drawer always
shows the full menu. Collapsing keeps the current reading and its state.
Collapsed navigation and utility icons use 17px glyphs. Navigation, Search and
reference rows have 36px-high targets; brand controls and the picker retain 32px.
The `sidebar-header`, `sidebar-footer` and `navigation` slots receive
`{ collapsed }`, so host branding and utilities can follow the rail's width.

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

`report` must be a `ProductReportV16` from `businesslens/report`. There is
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
  v-model:coverage="coverage"
  :report="report"
/>
```

| Model | Value | Default |
| --- | --- | --- |
| `section` | `overview` or a collection: `entity`, `interface`, `domain`, `capability`, `journey`, or `rule` | `overview` |
| `resource` | the stable key of the inspected resource (`screen:reader-web::…`), or `null` for the section's collection | `null` |
| `tab` | underlying collection: `overview` (Rows), `graph`, or `matrix` (Entities, Capabilities and Business Rules); Product Overview: `overview` (About), `coverage`, or `references` | `overview` |
| `resourceTab` | resource reading: `overview`, `structure`, `scenarios`, `lifecycle`, `connections`, or `references`; independent of `tab` | `overview` |
| `scenarioRoute` | the first route in the visible Scenario route window, or `null` | `null` |
| `routeColumns` | `auto`, or the reader's preferred number of visible route columns | `auto` |
| `coverage` | `{ path: string \| null }` | No path |
| `topology` | selected view, Journey, Scenario window, matrix column, focus, hidden kinds, expanded/collapsed groups, directory search | Domain map; no filters |

Every one is optional; bind the ones the host wants in its URL. A Scenario key
selects that Scenario inside its parent reading, or its own References when
requested, while the section stays on the originating working view.

The layer auto-imports `useBlrReportNavigation()` for hosts that use Vue Router.
It returns these eight models and encodes `s`, `e`, `t`, `rt`, `r`, `rc`, plus reading
key `cp` for Coverage, and `tv`, `tj`, `ts`, `tm`, `tf`, `th`, `tx`, and `tc`. Set
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
Hosts can instead bind their own state. Containment tree expansion is stored per resource, separately from the underlying collection or graph.
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

A collection is one set with shared drawings, selected with `section` and `tab`
and no resource key. The rail lists Overview and six collections. The filters
narrow the collection, and a dropdown beside them changes how
that set is drawn. Its preview cards name each view and explain it with a short
subtitle, without a separate help button or About section. The picker stays at
the right edge; the desktop legend and list controls sit to its left. On phones,
list expansion and the legend are available inside the picker. The heading, count, collection filters and chips stay the same.
Matrix is offered only by the three collections whose resources supply its rows.

| Section | Rows (`overview`) | Graph (`graph`) | Matrix (`matrix`) |
| --- | --- | --- | --- |
| `entity` | one row per Entity, grouped by Domain; Actors lead | Entity relationships | What changes what: Entities × Capabilities |
| `interface` | one tree card per Interface, its Experiences and Screens | Interface map | — |
| `domain` | one tree card per Domain, its Capabilities and Entities | Domain reach | — |
| `capability` | one row per Capability, grouped by Domain | Capability reach | Compare delivery: Capabilities × Interfaces |
| `journey` | one row per Journey | Journey reach | — |
| `rule` | one row per Business Rule, grouped by Domain | Rule reach | Rule attachments: Business Rules × attachment targets |

Each Matrix keeps the collection heading. Its preview card names the view and
states its question in the subtitle. One toolbar owns the scope in all three
drawings: primary resource selection, Domains and other existing axes, plus
Changed by (Entities), Available in (Capabilities), or Attached to (Business Rules).
Relationship selections narrow the primary resources and the Matrix columns using
the same authored relationship. With no selections, disconnected subjects remain.
Selections persist per collection across drawings and refresh; contextual links
select the same shared scope.

Entities offer only Entities, Domains and Changed by. Changed by uses the
Capabilities icon and includes creation, change and removal, never reads. Actor
access through Interfaces or Experiences and Journey participation remain in
resource readings. Available in uses
the authored delivery routes shown by the Matrix, with one grouped picker for
Interfaces, Experiences and Screens. An Interface includes delivery through its
Experiences and Screens; an Experience includes its Screens. Parent availability
does not invent delivery on every child Screen. Whole types and exact locations
combine with OR. The Matrix keeps Interface columns and shows only matching
routes. Capabilities have no separate Screen or Scenario filter. Attached to is one searchable
picker grouped by resource type, with whole-type and individual-resource choices.
These choices combine with OR; different axes combine with AND. Attachments mean
exact authored targets, excluding inherited reach and context restrictions on
another target. Rows carry compact relationship summaries explaining the filters.
Every selection has a removable chip; Clear resets the complete collection scope.

Matrices scroll vertically with the reading; edge controls, horizontal trackpad
gestures, and touch swipes move one column
at a time beside a fixed subject column. The first visible column uses `tm`;
moving between columns preserves vertical position and cell details. Each matrix's
shared toolbar offers a Legend popover with every possible badge color and meaning for
that view, regardless of report data, filters or the current column window.
The header and reading render together on the server. Body cells mount only for the
visible columns and one neighbour on each side; the browser animates their offset. A collection Graph
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
parent's background, with a subtle row highlight on hover. The Experiences & Screens and Screens tabs use the
same component. Each group has its matching resource-type icon and a count beside
its name: Experiences, Screens, Shared Screens, Capabilities or Entities. Resource
roots have no mixed total. Expansion chevrons sit before the type icons.

A resource name opens its reading directly, including roots with no children.
Chevrons toggle expansion; group labels also toggle their group. Arrow keys
navigate the tree and expand or collapse branches; Enter opens a resource or
toggles a group. There are no synthetic Overview children. Closing a root
preserves its folders' expansion state. Empty groups are omitted. Unassigned
appears only when it contains resources and has no resource link.
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
to the chrome height. The bundled local viewer fills a bounded flex viewport,
with only the optional theme lab bar above it.

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

Run `node scripts/check-comparison-tables.mjs <CLI viewer URL>` against this
repository's report or fixture-shop to check badge-to-panel keyboard focus,
bounded cell rendering on a large matrix, column navigation and mobile resizing.

### Coverage

Coverage opens with **Model scope**, then a small **How this model was
authored** disclosure revealing the short Method note when recorded. There is no
Coverage status badge or derived completeness indicator, in the navbar or the
Coverage reading, and no separate Rationale or Mapping details.

**Recorded locations** reads the four authored lists as one set of statements
whose category is an attribute. Its heading counts whole authored statements.
Four compact cards count Covered, Exclusions, Unmapped and Limitations,
including entries with no location, and are the only category filter; selecting
a card activates it, selecting it again restores every category. Card totals
never change with search or filtering.

Every statement is written under the path it names, and there is no path panel.
A row carries a filled dot per category recorded at that **exact** path, and
beside it how many statements that is: a folder never inherits meaning from
beneath it, because a count of "entries at or below" presented as a folder's own
annotation is neither files nor a share of what the folder contains. A **closed**
folder additionally says how many distinct statements are recorded inside it,
drawn as hollow dots and a muted `N inside`. That is a way in, not a claim about
the folder: it disappears when the folder opens, selecting it expands the folder
rather than reading anything, and one statement recorded at three paths below
counts once. The explanation itself waits behind the row's own count — opening a folder
reveals the paths inside it and nothing else, so structure stays browsable
without the prose that would bury it. Selecting the row's path or its count
reads them in place; selecting again puts them away. A statement recorded at
several paths is written in full under each of them, with its other locations
listed as **also recorded at** — one claim about several places, printed where
each place is read. Recognizable Product Model icons and the `.businesslens`
mark still mark authored model paths.

Search matches a statement by its own words or by where it is recorded, and
reveals the explanations it matched — a hidden answer is not an answer. Expand
all and Collapse all sit beside it and cover both axes: the folders and the
explanations. Expansion is remembered per report. Statements with no recorded location stay
visible under **No location recorded**, narrowed by the same card filter and
search; this includes model-wide Limitations, which have no separate section of
their own. Model References are not repeated here — they have their home in the
Product Overview's own References reading. No live repository inventory is
added.

`coverage.path` is navigation state, encoded as `cp`, and deep-links one
location: its ancestors open, its explanation is read, and the row is marked
current. Selecting that row
again clears it. Method disclosure does not change the URL. Tree expansion is
remembered for the report. Narrow screens scroll the reading within its frame.

## Navigation regression checks

Against a running built fixture-shop report, run
`node scripts/check-entity-lifecycle.mjs <url>` for state and change inspection,
Rows/Graph parity, panel expansion, keyboard access and saved reading state.
`node scripts/check-resource-slideover.mjs <url>` for desktop and mobile
inspection, independent Graph/Lifecycle state, nested Back/Forward, Scenario
position, direct links and keyboard dismissal.
`node scripts/check-resource-references.mjs <url>` covers reference ownership,
counts, previews, browser history and scrolling tabs on desktop and narrow screens.
`node scripts/check-report-navigation.mjs <url>` covers the collections, trees,
filters and named-view exits. Set `BLR_NAV_SCREENSHOTS` to a directory outside
the Product Model to save layout captures.
`node scripts/check-report-sidebar.mjs <url>` checks desktop collapse, keyboard
access, tooltips, saved state, utilities and the independent mobile drawer.


Check the collection preview picker against a running local viewer with
`node scripts/check-collection-views.mjs <viewer-url>`. This covers all six
collections, desktop and phone layouts, subtitles without About, saved filters,
keyboard selection and the fixed position beside the legend.
