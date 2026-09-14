# Report collections: one set, two drawings

Status: **implemented, uncommitted.** Written against `main` at `934f5a7`
(BusinessLens 0.12.0). Resource pages (the drilldown reached by clicking one
resource) are out of scope for this iteration and are not changed here.
`npm run verify` is green (383 tests), and `scripts/check-report-navigation.mjs`
and `scripts/check-topology-diagrams.mjs` pass against the fixture at 1440 and
390 wide.

## What was built differently, and why

| Planned | Built | Why |
| --- | --- | --- |
| `BlrTopologyBranch.vue` and its CSS go once Domain rows replace the Domain map (Phase 4) | Kept | The Interface page's delivery tree (`BlrInterfaceDelivery`) still renders branches. Only the grid rule and the Domain map projection went. |
| Occurrence ids `parent::child` (D4) | `parent>child`, exported as `OCCURRENCE_SEPARATOR` | Resource keys already contain `::` (`screen:reader-web::library`), so `::` could not delimit them. |
| Density offers Auto, 1, 2, 3, 4 (D8) | 1, 2, 3, 4; rows default to 1, tree cards to 3; one column below 640px | An Auto that meant one thing for rows and another for cards told the reader nothing. Review feedback after the tree cards landed. |
| The Domain graph's Unassigned bucket | Present, dropped once a filter narrows the set | An unfiltered set implies the bucket; a filtered one does not, and the bucket has no key a facet could name. |
| A tree with no subjects draws the Product root alone | It says "No resources in this scope" | A root with nothing under it answers nothing; the browser check now accepts either an arranged tree or the empty line. |
| The matrix view id `rule-reach` | Renamed `rule-attachments`; `rule-reach` now names the Business Rules Graph | The README calls the graph "Rule reach", and the matrix is what its tab says: attachments. |
| Focus stays a graph-only chip | As planned, and switching to Rows clears it | Rows cannot express a neighbourhood, so a chip claiming one there would lie. |
| The drawing switch as `UButtonGroup` | `UFieldGroup` | Nuxt UI v4 renamed the component. |
| Capability and Journey rows expanding to their Scenarios (D6, D7) | Plain rows; Scenarios are read on the page | Review feedback: the Scenarios added nothing a collection reader asked for. Composition is simply retired. |
| Interface and Domain rows as expandable resource rows (D5, D6) | One tree card per Interface or Domain, the Domain map's card grid with a Nuxt UI Tree inside | Review feedback: the expandable rows were awkward; the old map's cards read better and both collections share the design. |
| The three matrices as tabs of the Overview page (D9) | Rail rows of their own directly below Overview, at `s=delivery`, `s=what-changes-what`, `s=rule-attachments` | "Under the Overview" meant the rail, not the page. Review feedback after the first pass. |

## Intent

A collection surface shows one set of resources in one of two drawings,
**Rows** or **Graph**. The heading count, the filter controls and the chips
belong to the set, so switching the drawing never changes what is in it. The
switch is a two-icon control at the right end of the filter row, and it is not
a tab. Tabs remain only on the Overview and on resource pages.

Rows can be laid out in a chosen number of columns per collection, remembered
in a cookie, where zero means automatic.

The three cross-collection matrices — Compare delivery, What changes what and
Rule attachments — move under the Overview untouched. Composition is retired;
its reading folds into expandable Journey rows.

Per collection:

| Collection | Rows | Graph |
| --- | --- | --- |
| Entities | unchanged | Entity relationships, unchanged |
| Interfaces | row per Interface, expanding to Experiences then Screens | Interface map, unchanged |
| Domains | row per Domain, expanding to its Capabilities and Entities; Unassigned trails | new: Domain → places → Capabilities / Journeys / Rules |
| Capabilities | unchanged row, expanding to its Scenarios | new: Capability → places and Rules |
| Journeys | row per Journey, expanding to its Scenarios with their Capability chain | new: Journey → places and Rules |
| Business Rules | unchanged | new: Rule → attachment targets and Contexts |

## The standard this supersedes

`AGENTS.md`, Report viewer standards, currently says:

> **Tabs are the only switch.** A tab changes which set is on screen, the rail
> changes the subject, the toolbar only narrows. There is no representation
> control: a second drawing is a tab of its own, accountable for its own
> derivation.

This plan replaces that bullet explicitly. The new wording:

> **A collection is one set with two drawings.** The rail changes the subject,
> the filters narrow the set, and a Rows/Graph switch beside the filters changes
> only how the same set is drawn. Each collection's Graph states one derivation
> and is accountable for it. Tabs exist only on the Overview and on resource
> pages, where they change which set is on screen.

The bullet "The Product's page is a page like the others … Its readings are
About, Coverage and References" gains the three matrices: "Its readings are
About, Coverage, References, Compare delivery, What changes what and Rule
attachments."

## Decisions

- **D1 — State key.** The existing `t` query param stays. A collection accepts
  exactly `overview` (Rows) and `graph` (Graph). The topology view id is a
  fixed derivation from the collection, so `REPORT_DESTINATIONS` becomes one
  row per collection with a graph plus the three Overview matrices.
- **D2 — The drawing choice is URL only.** No cookie. A shared link lands
  where it was, the rail row opens Rows, and only the density is a preference.
- **D3 — One set of filters.** The row facets (`facetKindsFor`) are the only
  controls on both drawings. The graph's own Resource-types control
  (`hiddenKinds`, `th`) is retired for collections. Focus (`tf`) stays as a
  URL value set by a resource page's exit button and is shown as a chip in the
  shared filter bar so it can be cleared. The matrices under the Overview keep
  both of their controls unchanged.
- **D4 — Four new graphs share the Interface map machinery.** Each is a
  containment-style tree rooted at the Product, drawn by `BlrTopologyTree` and
  `BlrDiagram`'s tree layout, direction DOWN. Children are occurrences with
  `parent::child` ids, so a Screen reached by three Capabilities is drawn under
  each. Branches collapse and expand through `tx`/`tc` as today. Tiers:
  - Domains: Product → Domain → place (Interface › Experience › Screen resolved
    from Contexts) → the Capabilities, Journeys and Rules reached through that
    place. Resources with no Domain sit under an Unassigned branch.
  - Capabilities: Product → Capability → its places and its Rules.
  - Journeys: Product → Journey → its places and its Rules.
  - Business Rules: Product → Rule → its attachment targets (Entities,
    Capabilities, Journeys, Scenarios) and its Contexts.
- **D5 — Domain rows.** A Domain row is `BlrResourceCard`; it expands inline to
  its Capabilities and Entities as rows, Unassigned trailing. The row body
  opens the Domain page; the count at the row's end toggles expansion.
- **D6 — One expandable-row primitive.** Built once, used by Interfaces,
  Domains, Capabilities and Journeys. Default collapsed; expansion is kept in
  session storage beside `closedGroups`, keyed by collection and row key.
  Entities and Rules stay flat.
- **D7 — Expanded Journey.** One row per Scenario; its hook reads the
  Capability chain in Step order (`A → B → C`). No routes, no third level.
  Expanded Capability rows list their Capability Scenarios the same way.
- **D8 — Density.** A select offering Auto, 1, 2, 3, 4 columns, right of the
  drawing switch, present on Rows only. One cookie `blr-columns` holding a map
  by collection (`{ entity: 2 }`), one year, `sameSite: 'lax'`, `path: '/'`,
  so a server-rendered host paints right on first load. In a multi-column grid
  the card stacks its metrics under the title instead of hiding them.
- **D9 — Matrices under the Overview.** Reached as `s=overview` with
  `t=delivery`, `t=mutations` or `t=attachments`. They keep `BlrProductTopology`,
  its filter bar and the `topology` model exactly as now. Resource-page exit
  buttons keep pointing at them with focus set.
- **D10 — No graph, no switch.** Where a collection has no graph yet, the
  control is absent, not disabled. Phases ship independently.

## Work order

Each phase ends with `npm run verify` green and is committable on its own.

### Phase 1 — Supersede the standard

- `AGENTS.md`: replace the two bullets quoted above.
- `layers/nuxt/report-viewer/README.md`: rewrite the `tab` row of the model
  table, the "Collection readings" table and the "Tabs are the only switch"
  paragraph to the new contract. Drop the stale `scenarioMode` row.

### Phase 2 — Relocate the matrices, retire Composition

- `utils/reportDestinations.ts`: `delivery`, `what-changes-what` and
  `rule-attachments` get `rail: 'overview'`. Remove `journey-composition`.
- `utils/productTopologyViews.ts`: remove `value-paths`; update the header
  comment.
- `components/BlrOverview.vue` / `BlrReportShell.vue`: Overview tabs become
  About, Coverage, References, Compare delivery, What changes what, Rule
  attachments. The last three render `BlrProductTopology` in place of the
  page body, exactly as a collection's named view does today.
- Delete `components/BlrTopologyComposition.vue`, `journeyCompositionProjection`
  and the `.blr-composition-*` CSS in `assets/report-topology.css`. Keep
  `compositionProjection` only if a resource page still calls it.
- `useBlrReportNavigation.ts`: `destinationForLocation('overview', mode)` must
  resolve; the `tv` write rule already handles it.
- Tests and scripts: `test/report-destinations.test.ts` (the "no destination
  on the Overview" assertion inverts), `test/product-topology.test.ts` (six
  views, not seven; Composition cases go), `scripts/check-report-navigation.mjs`
  and `scripts/check-topology-diagrams.mjs` (`LOCATION` and `entries` tables),
  `scripts/check-packed-diagrams.mjs` if it names a moved surface.

### Phase 3 — The drawing switch and shared filters

- `reportDestinations.ts`: a collection's graph is `{ rail, view }` with
  `mode: 'graph'`; `destinationForLocation(section, 'graph')` resolves it.
- `BlrReportShell.vue`:
  - `surfaceTabs` no longer lists collection views; the tab strip renders only
    for the Overview and resource pages.
  - The filter bar renders for both drawings; `showToolbar` drops the
    `!topologyActive` clause for collections.
  - The bar's right end holds a `UButtonGroup` of two icon buttons, Rows and
    Graph, bound to `pageTab` (`overview` / `graph`), rendered only when the
    collection has a graph (D10).
  - The graph receives `visibleResources` (the facet-filtered set) and draws
    only trees whose subject is in it. Heading count is shared.
  - Focus chip: when `topology.focus` is set, append a chip to `facetChips`
    whose removal clears it.
- `BlrProductTopology.vue`: split. The Overview matrices keep this component
  and its own bar. A new `BlrCollectionGraph.vue` takes `workspace`, the
  collection kind, the visible keys and `reading`, and renders the Entity
  relationships diagram or the Interface map without a filter bar of its own.
- Icons: add the two switch glyphs to `nuxt.config.ts` `icon.clientBundle`.
  Use unreserved glyphs (`i-lucide-rows-3`, `i-lucide-waypoints`); kind marks
  stay reserved.
- Scripts: `check-report-navigation.mjs` clicks the switch instead of a tab
  and asserts `t=graph`; `check-topology-diagrams.mjs` `LOCATION` maps
  `sitemap` and `what-it-keeps` to `['interface','graph']` and
  `['entity','graph']`.

### Phase 4 — Expandable rows

- New `components/BlrExpandableRow.vue`: wraps `BlrResourceCard`, adds a
  trailing count-and-chevron toggle, and renders `children` as nested
  `BlrResourceCard`s in an indented column (`BlrTopologyBranch`'s
  `.blr-topology-children` rule is the visual reference).
- New `utils/collectionChildren.ts`: `rowChildren(workspace, resource)` returns
  `{ label, resources }[]`:
  - Interface → Experiences (each with its Screens), then shared Screens.
    Reuse `interfaceProjection(workspace)` without delivery.
  - Domain → Capabilities, Entities. Reuse `productMapProjection`.
  - Capability → Capability Scenarios.
  - Journey → Journey Scenarios; each Scenario's hook overridden to its
    Capability chain (D7). Add an optional `hook` override to
    `BlrResourceCard`.
- Domain rows replace the Domain map: `productMapProjection` is now consumed by
  rows only; `BlrTopologyBranch.vue` and the `.blr-topology-grid`,
  `.blr-topology-branch*` CSS go once nothing else renders branches.
  (`interfaceProjection(…, true)` remains for the Interface page's
  `BlrInterfaceDelivery`.)
- Expansion state joins the `blr:collections:` session-storage record as
  `expanded: string[]`, keyed `${kind}:${resource.key}`.
- Tests: `collectionChildren` unit tests against fixture-shop — a shared
  Screen appears once under its Interface, a Domain's children equal the
  Domain map's, a Journey Scenario's chain matches its Steps' Capabilities in
  order.

### Phase 5 — New graphs

- `utils/topologyProjections.ts`: `domainTreeProjection`,
  `capabilityTreeProjection`, `journeyTreeProjection`, `ruleTreeProjection`,
  each returning a `TopologyBranch` rooted at `product:<id>` with occurrence
  ids `${parent.id}::${child.key}`. Places resolve from `contexts` to the
  most specific resource present (Screen, else Experience, else Interface).
- `productTopologyViews.ts`: four new view entries with question, diagram type
  and note; `kinds` lists what each draws.
- `reportDestinations.ts`: map the four collections to their views.
- `BlrCollectionGraph.vue`: route these to `BlrTopologyTree`. Filtering keeps
  a tree whose root resource is in the visible set; focus keeps the focused
  subtree as the sitemap neighbourhood does today.
- `topologyState.ts` `sanitizeTopologyReading`: occurrence ids are valid
  expand/collapse targets.
- Tests in `test/product-topology.test.ts`: every root is a resource of the
  collection, every leaf resolves in `byKey` after stripping the occurrence
  prefix, no tree draws an edge the model does not author, a Capability with
  no Contexts and no Rules is a leaf.
- Scripts: `check-topology-diagrams.mjs` runs `checkSitemap`-style geometry
  on all four at 1440 and 390.
- `nuxt.config.ts`: any new icons.

### Phase 6 — Density

- New `composables/useColumns.ts`: `useCookie('blr-columns')` holding
  `Partial<Record<ReportResourceKind, 0|1|2|3|4>>`; `columnsFor(kind)` returns
  the preference, default `0`.
- `BlrReportShell.vue`: `USelect` beside the switch, Rows only; the row
  container becomes a CSS grid with `grid-template-columns:
  repeat(<n>, minmax(0, 1fr))`, or `auto-fit, minmax(min(28rem, 100%), 1fr)`
  for `0`. Grouped collections apply the grid inside each group.
- `BlrResourceCard.vue`: a `stacked` prop moves the metrics under the title;
  set when columns is not `1`.
- `README.md`: document the cookie beside `blr-tooltips`.

### Phase 7 — Close out

- `CHANGELOG.md` `[Unreleased]`: Rows/Graph switch on every collection,
  filters shared between them, columns preference, Domain and Journey rows
  expand, three matrices moved to the Overview, Composition removed.
- `.businesslens/capabilities/explore-product-topology/scenarios/*`: the
  scenarios naming "Compare delivery from the Interfaces collection" and "its
  named view alongside the List" now say the Overview and the Graph drawing.
  `npm run lint` on the self-model.
- `npm run verify`, then `npm run view:fixture` and the two Playwright scripts
  against it at 1440 and 390.

## Acceptance

- On every collection, switching Rows ↔ Graph keeps the heading count, the
  selected facets and the chips; the URL differs only in `t`.
- A facet selected on Rows removes the same subjects from Graph.
- `s=overview&t=delivery`, `t=mutations`, `t=attachments` open the matrices
  with their own controls; `s=journey&t=composition` opens Journey Rows.
- Domain Rows, expanded, list what the Domain map listed at `934f5a7`.
- A Journey row expanded shows each Scenario's Capability chain in Step order.
- The columns select is absent on Graph; a choice survives reload and is
  independent per collection.
- `npm run verify` green; both Playwright scripts pass on the fixture.
