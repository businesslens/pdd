# Report viewer UX: what we build, place by place

Status: **implemented.** All six phases are done and verified against the
Content Feed Reader Blueprint at 1600×1000 and 1180×900; `npm run verify` is
green (234 tests, repository and Blueprint checks).

## What was built differently, and why

Six deviations from the text below. Each is a decision made against the running
app, not a shortcut.

| Planned | Built | Why |
| --- | --- | --- |
| Topology focus joins `PRODUCT_TOPOLOGY_VIEWS` as a seventh named view (L) | A `focus` prop that switches to `Everything` and sets the existing `focusIds` filter | "Everything, one hop around this entity" is a *narrowing* of a view, not a new derivation. The filter machinery already did exactly this. Adding a view would have invented a question the model does not ask. |
| A table row opens a page; a card row peeks | Both peek; the page is reached from the peek, a hook, a parent, or ⌘K (I) | Two lenses onto one collection should not disagree about what a click means. One rule: rows peek, peeks open pages. |
| Capability Scenario table drops to ≤5 columns (D) | 7 columns | The rule works — `Actors` and `Decisions` were constant and went. The number in the acceptance was an estimate; `Contexts`, `Screens` and `Business rules` genuinely vary in this Blueprint. |
| The peek never scrolls (I) | Never at 1600×1000; the Screen peek overflows ~100px below an 800px-tall viewport | Capping content further would cost every reader information to satisfy a short window. A small honest scroll beats a clipped list that looks complete. |
| ⌘K lands on the surface with the peek open | ⌘K lands on the entity's page | Naming something means meaning it. The peek exists for scanning, which ⌘K is not. |
| `counterpartKey` copied into the layer (K) | Computed in `projectReportWorkspace` from the ids | Every other derived relation is already there, and the report carries no counterpart field to read. |

The acceptance for B — "chrome above the first entity row is one row" — is met
for the *toolbar*, which is 49px and never wraps at either width. Total space
above the first row is 106px on a root collection and 196px on a parent with a
Scenarios tab, because N adds a question line (37px) and F adds a tab strip
(44px). Both are content this plan asked for, not chrome it failed to remove;
the three-and-four-row control stack is gone.

`BlrOverview` was extracted while finishing Phase 5: the Workbench had grown to
1556 lines, and the blast radius predicted the page extraction would shrink it.
It is 1261 now, against 1373 before any of this.

One repair outside the plan: the local viewer resolved the Blueprint logo at
`.businesslens/logo.svg`, which schema 5 moved to `product/logo.svg`. It was
returning 500 on every load.

Two tests in `test/report-viewer.test.ts` asserted the architecture this plan
replaces — completeness in the inspector, and the Scenario drilldown. They are
rewritten to guard the new invariants instead: the authored body stays out of
the peek, depth stays one level, Scenarios stay off the rail, and both
navigation facts stay bindable.

---


This is the build document for `plans/report-viewer-navigation-and-depth.md`.
That document records *why* and carries the decisions (`D1`…`D13`), the open
questions (`O1`…`O4`) and the blast radius. This one records *what we build,
where, and in what order*. Where they disagree, the decision document wins.

Written against `pdd` branch `codex/report-lab-topology-views` at `96185fa`
with the schema-5 working tree applied. Line numbers may drift.

## How to read this

Work is organized by **place** — a surface a reader actually stands on. Each
place has one section, and each section is written the same way:

- **Today** — what is there now, and what it costs.
- **Target** — the shape we build, concretely.
- **Rules** — behaviour that must hold.
- **States** — empty, filtered-empty, single, many, narrow.
- **Acceptance** — checkable, against the measured baseline.

Places are grouped into phases. **Every phase ships on its own and leaves
`npm run verify` green.** Phases 0–2 are independent of routing and can land
without touching the inspector.

## The places

| # | Place | Phase | Decisions |
| --- | --- | --- | --- |
| **A** | Panel scroll defect | 0 | P1 |
| **B** | Surface toolbar | 1 | D5, D6 |
| **C** | Entity row (the card) | 1 | D5, D9 |
| **D** | Entity table | 1 | D10 |
| **E** | Navigation rail | 2 | D1 |
| **F** | Parent surfaces and their Scenario tab | 2 | D2 |
| **G** | Default grouping | 2 | D7 |
| **H** | State and routes | 3 | D4 |
| **I** | The peek | 4 | D3 |
| **J** | Entity pages | 4 | D3, O2 |
| **K** | Counterparts | 4 | D8 |
| **L** | Topology focus | 4 | D11 |
| **M** | Overview | 5 | D12 |
| **N** | Surface header | 5 | D13 |
| **O** | Docs, changelog, standards | 5 | — |

Baseline for every "Acceptance" below: Content Feed Reader Blueprint, 68
entities, Chromium at 1600×1000 and 1180×900.

---

# Phase 0 — The defect

Ships alone, in an afternoon. Nothing else depends on it and it removes a real
source of confusion today.

## A. Panel scroll defect

**Today.** The inspector body keeps its scroll offset across an entity change.
Reproduced: Capabilities → *Reading state* → *Mark an item read* → *Unread
library* opens at `scrollTop: 503` — below the entity's own id, lead and facts.
The chip that was clicked sat low in the previous document, and the offset
survives the swap. `BlrInspector.vue:62-73` rehydrates history on entity change;
nothing resets the scroll container.

**Target.** On every entity change, the panel body scrolls to 0 before paint.

**Rules.**
- Reset on entity change, not on open — reopening the same entity from the same
  list should not fight the reader.
- Going back through the panel history resets too. Restoring the previous offset
  is a nicer idea that stops being nice the moment the two documents differ in
  length, which is always.

**Acceptance.** The three-click chain above lands at `scrollTop: 0` with the
title in view.

---

# Phase 1 — Subtraction

Nothing structural. Remove chrome and put the useful fact where the useless one
was. This is the phase that makes the app stop reading as messy, and it touches
no navigation and no routing.

## B. Surface toolbar

**Today.** Two to four fixed rows above every collection, at every width, for
every kind:

```
Filter [Domains v][Interfaces v][Experiences v][Cap Scenarios v][Journey Scenarios v][Journeys v][Screens v][Rules v]
                                                        Group by [Nothing v]  [Cards|Table]
Card style [Catalog][Index][Editorial]  Two-line recognition cards with three compact facts.
```

Seven filter dropdowns above 4 Journeys. Five above 2 Actors. At 1180px the
filters wrap and the block takes roughly a third of the viewport before the
first row of content. `BlrWorkbench.vue:734-796` (filters), `:799-820`
(card style).

**Target.** One row, and often none:

```
[⌄ Filter]  [Domain: Reading ×]  [× Clear]              Group by [Domain v]  [Cards|Table]
```

- `Filter` opens a popover holding the same facets, one section per relation
  kind, each a searchable multi-select. Same data, same semantics (OR within a
  facet, AND across facets — `entityFacets.ts:159-167`).
- A chip appears **per active selection**, not per available facet. Clearing is
  per chip, plus one `Clear` when two or more are active.
- The `Filter` control is hidden entirely when the collection holds fewer than
  8 entities. Actors (2), Interfaces (2), Experiences (3), Domains (3),
  Journeys (4) and Business rules (4) therefore show no filter control at all in
  this Blueprint.
- **Card style is deleted.** `index` becomes the only layout (see C). If
  `catalog` and `editorial` are worth keeping they move to
  `layers/nuxt/theme-lab/`, which is what that layer is for.

**Rules.**
- `facetKindsFor` (`entityFacets.ts:128-143`) is unchanged. This is presentation
  only; no facet is added or removed.
- Per-kind toolbar state still persists across kind switches
  (`BlrWorkbench.vue:129-131`) — leaving a surface and returning must return the
  filters you left.
- The row is not sticky. It scrolls with the collection; the breadcrumb bar
  above already holds the persistent controls.

**States.**
- *Under threshold* — no `Filter`, no chips. Group by and the lens toggle stay.
- *Filtered to nothing* — the existing message
  (`BlrWorkbench.vue:1178-1181`) plus a `Clear filters` button in the same block.
  Today it tells you the result and leaves you to find the control.
- *Narrow (<1280px)* — `Group by` collapses to an icon button with the current
  grouping as its tooltip. The row never wraps.

**Acceptance.** Chrome above the first entity row is **one row at 1600px and one
row at 1180px**, on every surface, down from three and four.

## C. Entity row (the card)

**Today.** The default `catalog` card repeats the kind label on every card of a
surface already named after that kind, and shows a badge that is sometimes
useful (`Collections`, `Primary`) and sometimes not (`1 context`). Cards have
ragged bottoms where leads differ in length. The one fact that identifies the
entity is missing: no Capability Scenario card names its Capability, and no
Screen card names its scope — so "Saved items", "Source list" and "Unread
library" each appear twice with nothing to tell them apart.

**Target.** The `index` row (`BlrEntityCard.vue:47-67`) becomes the only layout,
with the freed kind slot carrying the discriminating fact:

```
⚡  Reading state   Reading                                    3 scenarios  1 journey  2 screens  ›
    Tracks which library items the Reader has read and presents a finite unread backlog…
    Used by  Catch up on unread
```

```
🖵  Unread library                                    3 capabilities  6 cap. scenarios  2 journey scenarios  ›
    Presents a finite backlog and the actions that make progress through it.
    Available in  Reader web application › Personal library
```

**This is mostly free.** `entityCardPresentation` (`entityCards.ts:118-269`)
already computes `hookLabel` + `hook` for all ten kinds, and they are already the
right facts:

| Kind | Hook label | Hook |
| --- | --- | --- |
| Screen | Available in | `Interface › Experience` |
| Capability Scenario | For capability | parent Capability |
| Journey Scenario | In journey | parent Journey |
| Experience | Within | its Interface |
| Capability | Used by | its Journeys |
| Journey | Performed by | its Actors |
| Domain | Includes | its Capabilities |
| Business rule | Attached to | what it binds |
| Actor | Enters / Performs | Interfaces, else Journeys |
| Interface | Contains / Delivers directly | Experiences, else Capabilities |

They are rendered today **only in the `editorial` variant**
(`BlrEntityCard.vue:91-94`), which is not the default and which we are deleting.
The work is promoting the hook into the index row, not computing anything new.

**Rules.**
- The kind icon stays (colour-coded, `BlrKind`); the kind *word* goes.
- The badge stays only where it discriminates: Domain on a Capability, kind on a
  Capability Scenario, kind · result on a Journey Scenario, kind · relationship
  on an Actor, access mode on an Experience. **The Screen badge (`1 context`) is
  dropped** — the hook carries the real content.
- One row is one click target opening the peek. The `›` chevron is decoration,
  not a second target.
- Metrics stay right-aligned and hidden below `lg` (already the case).

**States.**
- *No lead authored* — the hook line moves up; the row shrinks rather than
  reserving empty space.
- *No hook* (an Actor performing nothing) — the row is two lines. Never render an
  empty label.
- *Narrow* — metrics hide, hook stays. The hook is what disambiguates, so it
  survives every width.

**Acceptance.** On the Screens surface at 1600px, the six same-titled rows are
distinguishable without opening anything.

## D. Entity table

**Today.** The Capability Scenario table renders 8 columns of which 5 are
constant across all 24 rows: Capabilities `1`, Actors `1`, Decisions `0`, plus
mostly-zero Business rules. A Capability Scenario has exactly one Capability
(`entityFacets.ts:101`), so the column shows `1` where `Reading state` would
fit. `BlrWorkbench.vue:484-495` and `:496-509`.

**Target.** Two rules, applied to every kind's column set:

1. **A relation that is single-valued by the format renders its title, not its
   count.** Capability Scenario → Capability; Journey Scenario → Journey;
   Capability → Domain (already text, `:462-465`).
2. **A column constant across the visible rows is not rendered.** Evaluated
   against the filtered set, so filtering can reveal a column and clearing it can
   hide it again.

The hover-for-names behaviour on genuine count columns
(`countCell`, `:330-332`) stays — it is good and cheap.

**Rules.**
- Constancy is computed on `visibleEntities`, not on the whole collection.
- The title column and its sort are never dropped, however constant.
- `TABLE_NOTE` (`:525-532`) survives, but any note explaining a column that rule
  2 removed goes with it.

**Acceptance.** The Capability Scenario table renders at most 5 columns on the
unfiltered Blueprint, and the parent Capability is one of them, by name.

---

# Phase 2 — Structure

The navigation answer. Independent of routing: everything here works with the
current in-memory `section` model.

## E. Navigation rail

**Today.** 12 destinations, 2 of them indented under their parent
(`RAIL_PARENT`/`RAIL_KINDS`, `BlrWorkbench.vue:78-90`; `.blr-navchild`,
`:1346-1357`). The indentation is uncommitted and is reversed by D1: the rail
lists *kinds*, and kinds do not nest — instances do. With schema 5 the format
declares the full Interface → Experience → Screen hierarchy as well, so indenting two rows is either incomplete
or becomes a three-level tree inside a ten-row rail.

**Target.** One flat, ungrouped list, in the authored order of
`REPORT_ENTITY_KINDS` (`reportWorkspace.ts:83-99`), which already walks the
format:

```
EXPLORE
  ▣ Overview
  ⌇ Topology

BROWSE
  ⚇ Actors               2
  ⚯ Interfaces           2
  ▤ Experiences          3
  🖵 Screens             8
  ⬡ Domains             3
  ⚡ Capabilities       10
  ⇢ Journeys            4
  ⚖ Business rules      4
```

10 destinations, down from 12. No indentation. No importance grouping — a
"Product" versus "Structure" split was considered and rejected as artificial: an
Experience is no less part of the product than a Capability.

**Rules.**
- Both Scenario kinds leave the rail. They are reached from their parent (F),
  from a card's hook, from ⌘K, and from a relation chip.
- Counts stay. They are the cheapest signal of model shape in the app.
- The active row keeps its kind-coloured inset bar.
- The mobile slideover rail (`:1223-1270`) mirrors this exactly. It is currently
  a second copy of the rail markup; collapse both onto one component while the
  rail is being touched.

**Acceptance.** No indented rail item exists in either the desktop or mobile
rail, and both Scenario collections remain reachable in at most two clicks from
anywhere.

## F. Parent surfaces and their Scenario tab

**Today.** Scenarios are a destination of their own. The docs already resolved
this the other way: `AGENTS.md:65-70` — *an entity with a mandatory single parent
is documented on its parent's page, never on one of its own* — and the material
lives at `docs/capabilities.md:115` and `docs/journeys.md:122`.

**Target.** The parent surface owns both collections:

```
Capabilities  ·  [ Capabilities 10 ] [ Scenarios 24 ]
Journeys      ·  [ Journeys 4 ]      [ Scenarios 8 ]
```

The tab is a peer switch above the toolbar. Selecting `Scenarios` swaps the
collection, its facets, its grouping and its table columns — a complete browse
surface, which is what the code comment at `BlrWorkbench.vue:70-77` was defending
when it argued against nesting. The tab *is* that surface. What is lost is a rail
row claiming a Scenario is a peer of an Actor.

**Rules.**
- The tab writes the child kind to `section` (`capability` ⇄ `capability-scenario`
  — the `WorkbenchSection` union at `:93` already spells both), so the tab is
  addressable once Phase 3 lands, and the breadcrumb reads
  `Content Feed Reader › Capabilities › Scenarios`. This resolves **O4**.
- Toolbar state is per section, so each tab keeps its own filters and grouping —
  the existing per-kind maps at `:129-131` already do this.
- Every other kind renders no tab strip at all. A single-tab strip is chrome
  pretending to be a choice.
- The other four Scenario entry points keep working unchanged: ⌘K
  (`onSearchSelect`, `:291-306`) currently routes a Journey Scenario to its
  Journey page; a Capability Scenario should route to its parent's Scenarios tab
  with the peek open, by the same reasoning.

**Data.** Needs `scenariosByCapability` on the workspace.
`reportWorkspace.ts:378` and `:1029-1032` build `scenariosByJourney` only.

**States.**
- *No Scenarios authored for any Capability* — the tab still renders, with a `0`
  and an empty-state sentence. Hiding it would make the model look like it lacks
  the concept rather than the content.
- *Orphan Scenarios* — the existing orphan block (`:1183-1194`) moves onto the
  Scenarios tab of the parent kind, where it belongs.

**Acceptance.** Both Scenario collections keep their full facet set, table and
grouping, and the rail has no Scenario row.

## G. Default grouping

**Today.** `groupEntities` exists and works well (`entityFacets.ts:186-215`),
and `groupKind` defaults to undefined for every kind
(`BlrWorkbench.vue:130`, `:155-161`). Grouping Capabilities by Domain is the best
list view in the app and nobody sees it.

**Target.** Each surface opens grouped by the format's own structure:

| Surface | Grouped by | From |
| --- | --- | --- |
| Screens | Interface | path hierarchy |
| Experiences | Interface | path hierarchy |
| Capabilities | Domain | subject axis |
| Capability Scenarios | Capability | behavior tree |
| Journey Scenarios | Journey | behavior tree |
| Business rules | Domain | subject axis |
| Actors, Interfaces, Domains, Journeys | not grouped | roots |

**This is where the hierarchy the tree rail was asked for actually lands** — over
instances, where the model has it, and dismissible in one click.

**Rules.**
- The group header already carries kind icon, title and count
  (`:1125-1148`). With grouping on by default, the group header now states what
  the card badge used to repeat — so a card inside a group **drops the badge that
  duplicates its group** (a Capability under `Reading` does not also say
  `Reading`).
- Group headers are collapsible and default open.
- `Group by: Nothing` remains one click away and is remembered per section.
- An entity relating to several group owners still appears under each
  (`entityFacets.ts:203-210`, deliberate). With a default grouping this becomes
  visible for the first time — verify it reads as "in both" and not as a
  duplicate, on the Screens surface especially.

**Acceptance.** Every surface with an authored parent opens grouped, and the
group a card sits in is never repeated on the card.

---

# Phase 3 — Routing

Small, and it blocks Phase 4. Pages without URLs are not pages.

## H. State and routes

**Today.** The URL never changes. `BusinessLensReportViewer.vue:23` exposes
`v-model:section` and the local host never binds it
(`viewer/app/app/pages/index.vue:81`). No deep link, no browser back, and F5
returns to the Overview.

**Target.** The layer stays host-agnostic and exposes two bindable models; hosts
map them to their own router.

| Model | Values |
| --- | --- |
| `section` | `overview` \| `topology` \| an entity kind (exists) |
| `entity` | `null`, or the qualified key of the open entity page |

The local viewer binds both to query parameters:

```
/?s=capability
/?s=capability-scenario
/?s=screen&e=reader-web::personal-library::unread-library
/?s=topology&view=value-paths
```

**Rules.**
- Unknown values fall back to `overview`, as `section` already does
  (`BlrWorkbench.vue:106-114`).
- The peek is **not** in the URL. It is a transient reading aid; the page is the
  addressable thing. This keeps back/forward meaningful instead of replaying
  every hover-weight glance.
- Filters and grouping are **not** in the URL in this phase. Revisit only if
  sharing a filtered surface turns out to be a real request; it doubles the
  state surface for a use we have not seen.
- Live recompile must still rehydrate by key (`:231-235`) — a route that names a
  deleted entity falls back to its kind's surface with a note, not to a blank.

**Blocked on O3.** Confirm the catalog host can honour `v-model:entity` before
Phase 4 starts linking to pages.

**Acceptance.** Every surface, every tab and every entity page is reachable by
URL; browser back walks the trail; F5 lands where you were.

---

# Phase 4 — Depth

The largest phase. Do not start it while the URL is still constant.

## I. The peek

**Today.** One 672px slideover renders 570px (Actor) to 2264px (Journey
Scenario) of content — every authored field of every kind, in a fixed order, at
one visual level (`BlrInspectorDetail.vue`, the only heading style at `:498-503`).
Chips re-target it indefinitely; three deep the header is a bare `←` with no
trail while the centre pane shows an unrelated list.

**Target.** Four zones, fixed, short, non-scrolling. Depth is always 1.

```
┌──────────────────────────────────────────────┐
│ ⚡ Capability                              ✕ │
│ Reading state                                │
│ reading-state                                │
├──────────────────────────────────────────────┤
│ Tracks which library items the Reader has    │
│ read and presents a finite unread backlog.   │
│                                              │
│ Domain      Contexts   Scenarios             │
│ Reading     2          3                     │
│                                              │
│ Connects to                                  │
│ ⚡ 3 Scenarios  ⇢ 1 Journey  🖵 2 Screens    │
│ [Mark an item read] [Mark an item unread] +1 │
│                                              │
│ [ Open Capability page → ]                   │
└──────────────────────────────────────────────┘
```

1. **Identity** — kind, title, **qualified id**. The id is what distinguishes
   counterparts; ⌘K already shows it and the cards do not.
2. **Lead** — one sentence.
3. **At most three facts, chosen to discriminate** — a Screen's scope, not its
   state count; a Scenario's parent and result. Never a fact the header already
   states (`Type: Capability Scenario` under a header reading *Capability
   Scenario*, `BlrInspectorDetail.vue:116`), and never one the badge states.
4. **Connects to** — chips grouped by kind with counts, capped per kind, `+N`
   opening the page.

Then one action: `Open <kind> page →`.

**Rules.**
- **A relation chip navigates to that entity's page.** It does not re-target the
  peek. This is the whole fix for unbounded nesting.
- The panel's own history stack and back button are deleted
  (`BlrInspector.vue:44`, `:62-87`, `:119-127`). Browser back replaces it.
- Non-modal and dim-without-pointer-events stays (`:98-107`) — clicking another
  row in the list re-targets the peek, which is the gesture the list depends on.
- Authored versus Derived stops being the top-level split of Connections
  (`BlrInspectorDetail.vue:459-463`). Group by kind — the reader's question is
  "what does this touch" — and mark derived provenance on the chip. The
  distinction stays visible; it is not the primary sort key.
- **The peek never scrolls.** If a kind cannot fit, its fact set is too long, not
  the panel too short.

**Moves out, to J:** Rule statement, Trigger, Flow, Routes, Steps, Decision
points, Outcome, Edge cases, Information presented, Available actions, Product
states, Access and placement, Supporting context, References
(`BlrInspectorDetail.vue:302-455`).

**Acceptance.** No peek exceeds the panel height for any entity in the Blueprint,
and no chain of chip clicks produces a second level of peek.

## J. Entity pages

**Today.** Exactly one kind has a page: Journey (`BlrWorkbench.vue:1046-1113`).
It is the best surface in the app — title, promise, availability, relations as
links, the flow canvas, then children as cards.

**Target.** Generalize it. Every kind gets a page, at a URL, with a breadcrumb.
Two shapes, decided by whether the kind has an authored body (**O2, resolved as
option b**):

**Heavy** — Journey, Capability, Screen, both Scenario kinds, Business rule:

```
Breadcrumb ›  Kind  Title  id                              [Inspect] [Topology]
Lead
Intent
Access and placement
Relations, as links
─────────────────────────────────────────────────────────
The authored body           ← Steps, Flow, Routes, Decision
                              points, States, Actions, Rule
                              statement — full width
─────────────────────────────────────────────────────────
Children as rows            ← Scenarios under a Capability
                              or Journey; counterparts under
                              a Screen
References
```

**Thin** — Actor, Interface, Experience, Domain: identity, relations, and the
neighbourhood graph at full width as the body. For these kinds the reach *is*
the content, which is why L is not optional.

**Rules.**
- The flow canvas is full width, not the fixed `h-96` box it occupies today
  (`:1080`).
- Every page carries the breadcrumb: `Product › Kind › Title`, each segment a
  link.
- A page never opens the peek for its own entity. `Inspect` on the Journey page
  (`:1051-1059`) becomes meaningless once the page is the complete reading and
  goes.
- Section headings on a page are a real hierarchy — H2 for sections, H3 within.
  The flat single-level heading style is a peek constraint, not a page one.

**Acceptance.** Every authored field reachable in today's inspector is reachable
on a page, and the Journey page's current content survives the generalization
unchanged.

## K. Counterparts

**Today.** The Screens surface shows "Saved items", "Source list" and "Unread
library" twice each with nothing to tell them apart. They are not duplicates:
`spec/format.md:177-181` names them **counterparts** — the same thing on two
Interfaces, on purpose — and `src/core/ids.ts:45-57` already computes the key. The
viewer does not know the concept exists.

**Target.** Three touches, one per place:

1. **Row** (C) — the hook already reads `Available in Reader web application ›
   Personal library`. Done in Phase 1.
2. **Surface** (G) — Screens group by Interface, so counterparts sit in different
   groups rather than adjacent rows. Done in Phase 2.
3. **Page** (J) — the Screen page cross-links: *Also on — Reader mobile
   application*. New here.

**Data.** The layer cannot import `src/core/ids.ts`. Compute the counterpart
grouping once in `projectReportWorkspace`, where every other derived relation
already lives, rather than adding a second id helper to the layer.

**Acceptance.** From any Screen page, its counterpart on the other Interface is
one click away and named as such.

## L. Topology focus

**Today.** `BlrInspector.vue:162-169` renders `BlrTopology` inside the 672px
panel, where node boxes are ~90px wide and unreadable — while the full-width
topology canvas sits behind it, dimmed and idle.

**Target.** A focus mode of the Topology destination: *Focus: Reading state*,
sharing the canvas the named views already use. The peek and every entity page
link to it.

**Rules.**
- It joins `PRODUCT_TOPOLOGY_VIEWS` (`productTopologyViews.ts:37+`) as a view
  with a question and a derivation, like the other six — *"What does this entity
  touch, and through what?"*
- The existing behaviours survive the move: intentional expansion, kind filtering
  that fades rather than removes, re-rooting with a back trail.
- The `Neighbourhood` tab leaves the peek header. The peek links out instead.

**Acceptance.** The neighbourhood graph renders at full canvas width, and the
inspector has no second tab.

---

# Phase 5 — Framing

Cheap, and it is what makes the app feel deliberate rather than merely tidy.

## M. Overview

**Today.** Identity, an Actor row, a count strip, then four collapsed
disclosures — About, Coverage, Model counts, References
(`BlrWorkbench.vue:834-1043`). Roughly 70% empty at 1600×1000. The four Journeys
are what the product promises and they are a rail click away, while `Model
counts` has a disclosure of its own.

**Target.** Identity, Actors and the count line stay. The **Journeys become the
body** — the same rows used on the Journeys surface, in authored order, each
opening its page. About / Coverage / Counts / References stay as disclosures
below.

**Rules.**
- The host slots (`navigation`, `primary-action`, `provenance`) keep their
  positions. The catalog host puts a pull command there and it must not move.
- No new data. The Journey rows are the component built in C.

**States.**
- *No Journeys authored* — fall back to Capabilities grouped by Domain. A model
  without Journeys is legal (`spec/format.md`), and the Overview should show
  whatever the model's largest promise is.

**Acceptance.** The Overview at 1600×1000 has no dead lower half.

## N. Surface header

**Today.** `BlrProductTopology.vue` states each view's question and its
derivation chain — *"What can the product do, and how is that capability
grouped?"* over `ACTORS → INTERFACES → DOMAINS ⊃ CAPABILITIES`
(`productTopologyViews.ts:47-63`). It is the clearest thing in the app and it
exists on exactly one destination. Browse surfaces state only their name and
count.

**Target.** Every browse surface gets the same two lines: the question it
answers, and the derivation behind its default grouping.

```
Screens  8
Where can the Reader see and do this?          INTERFACES ⊃ EXPERIENCES ⊃ SCREENS
```

```
Capability Scenarios  24
How do we know each Capability works?          CAPABILITIES ⊃ SCENARIOS
```

**Rules.**
- Reuse the `question` + `flow` + `separators` shape already defined for topology
  views (`productTopologyViews.ts:26-35`) so there is one vocabulary, not two.
- One line each. A surface needing a paragraph before it can be read is not
  ready, which `AGENTS.md` already says about views.

**Acceptance.** Every destination states its question in one line.

## O. Docs, changelog, standards

- `CHANGELOG.md:25-27` claims *"Scenario rail items are indented under the
  Capability or Journey that owns them"*. Unreleased and reversed by E —
  **rewrite it**, do not add a second entry contradicting the first.
- `plans/model-nesting-scenarios-and-assets.md:214-224` — add a pointer to the
  decision document rather than editing the record.
- `AGENTS.md` "Report viewer standards" — add the peek/page rule. It is a
  standard, and it belongs beside "named views, not a view builder".
- `layers/nuxt/report-viewer/README.md` — the layer's surfaces changed.
- `docs/cli-view.md` (order 31) — the reader-facing description of what
  `businesslens view` opens. **No new doc page**: `docs/` stays flat with
  contiguous orders (`scripts/check-repo.mjs`) and this is not a new entity.

---

# Cross-cutting rules

These hold in every place and are worth checking in every phase.

1. **The surface names the kind; the row does not repeat it.** Applies to cards,
   table cells, peek facts and page headers alike.
2. **A fact appears once per screen.** Domain is currently on the Capability
   card badge, the peek badge, the peek fact grid and the peek Connections — four
   times.
3. **Counts where the set is many; names where the set is one.** In rows, in
   tables, in facts.
4. **State that survives a recompile must also survive F5.** `AGENTS.md` asks for
   the first; H makes it mean the second too.
5. **Chrome scales with the collection.** No control that costs a row for a
   two-item list.
6. **Nothing renders an empty label.** Missing hooks, missing leads and empty
   facet sets shrink the element; they do not reserve space.

# Not doing

- **A tree rail.** Rejected in D1: kinds do not nest, instances do.
- **A view builder.** `AGENTS.md` forbids it and Topology's named views are the
  answer. Default grouping (G) is not a builder — it picks one derivation and
  states it (N).
- **Filters or grouping in the URL** (H) unless a real request appears.
- **Restoring peek scroll position** across entities (A).
- **A merged Scenario collection.** Settled in the earlier plan's D1, unchanged.

# Sequencing at a glance

| Phase | Places | Depends on | Ships alone |
| --- | --- | --- | --- |
| 0 | A | — | yes |
| 1 | B, C, D | — | yes |
| 2 | E, F, G | — | yes |
| 3 | H | O3 confirmed with the catalog host | yes |
| 4 | I, J, K, L | Phase 3 | as a unit |
| 5 | M, N, O | Phases 1–4 | yes |

Phases 0, 1 and 2 remove most of what reads as mess today and touch neither the
inspector nor the router. If only part of this lands, land those.
