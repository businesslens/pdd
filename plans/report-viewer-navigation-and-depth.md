# Report viewer: navigation, depth, and the cost of chrome

Status: **proposed.** Nothing here is implemented. Written against `pdd` branch
`codex/report-lab-topology-views` at `96185fa` with the schema-5 working tree
applied (263 changed paths, uncommitted).

Scope: `layers/nuxt/report-viewer/` and its two hosts (`viewer/app/`, and the
catalog host in the landing repository). No format change, no report contract
change. Line numbers are from the working tree above and may drift.

This document is deliberately explicit about file and line locations so it can
be picked up without the conversation that produced it.

**Part 1** is the diagnosis and the measurements behind it. **Part 2** records
the decisions. **Part 3** is what is still open. **Part 4** carries two
confirmed defects that are worth fixing whether or not the redesign lands.
**Part 5** is blast radius. **Part 6 is the operation path** — start there to
implement.

---

## What this supersedes

`plans/model-nesting-scenarios-and-assets.md` D1 has three clauses: keep both
Scenario collections, move the docs, and indent the Scenario rail items. The
first two stand. **The third is reversed here.**

| D1 clause | Status |
| --- | --- |
| Keep both Scenario collections; do not merge or embed | **stands** |
| Move Scenario docs off pages of their own | **stands, and went further than D1 asked** |
| Indent Scenario rail items under their parent | **reversed — see D1 below** |

D1's docs clause proposed one merged `docs/scenarios.md` at order 16. What
actually shipped in the working tree is stronger: `docs/capability-scenarios.md`
and `docs/journey-scenarios.md` are deleted outright, and the material lives as
`## Capability Scenarios` in `docs/capabilities.md:115` and `## Journey
Scenarios` in `docs/journeys.md:122`. `AGENTS.md:65-70` now states the rule:

> An entity with a mandatory single parent is documented on its parent's page,
> never on one of its own.

The Workbench currently does the opposite: it gives both Scenario kinds a
destination of their own and then indents it. That inconsistency is the
starting point of this plan.

---

# Part 1 — Diagnosis

## The one sentence

The Workbench has **one navigation axis (entity kind) and one detail container
(the slideover)**, applied uniformly to entities that differ enormously in size
and in role. Every symptom follows from that.

## What the format now says, and the viewer does not

`spec/format.md:119-121` states the model's shape outright:

> The model has **two hierarchies and one axis**. `availability` is the join
> between the two trees; Domain classifies members of both; Actors and Business
> Rules attach across everything.

- **Surface tree** — Interface → Experience → Screen. Ids carry the path:
  `reader-web::personal-library::unread-library` (`spec/format.md:165-172`).
- **Behavior tree** — Capability → Capability Scenario, Journey → Journey
  Scenario.
- **Subject axis** — Domain, over both trees.
- **Attaching across everything** — Actors, Business Rules.

`spec/format.md:183-187`: *the path owns every parent relation.* A Screen never
writes `availability:`, a Capability Scenario never writes `capability:`.

`spec/format.md:177-181` names a concept the viewer has no idea exists:

> Two entities of the same kind sharing a path suffix below their Interface are
> **counterparts** — the same thing on two surfaces.

`src/core/ids.ts:45-57` already computes `counterpartKey`. The report viewer
does not use it, and the Screens surface is the worse for it (see below).

## Measured

Taken from the running report at `127.0.0.1:57157` (Content Feed Reader
Blueprint: 68 entities), viewport 1600×1000, Playwright.

| What | Measurement |
| --- | --- |
| Rail | 12 destinations, uniform weight, 2 of 12 indented |
| Toolbar | 2–4 fixed rows of chrome regardless of content: **7 filter dropdowns above 4 Journeys, 5 above 2 Actors** |
| Inspector container | one 672px panel renders **570px** (Actor) and **2264px** (Journey Scenario) of content — 4× |
| Inspector sections | up to 7 headings, identical visual weight, fixed order |
| Cards | the kind label repeats N× on a surface already named after that kind |
| Screens surface | "Saved items", "Source list", "Unread library" **each appear twice, indistinguishable** — the card never says which scope |
| Capability Scenario cards | never name the parent Capability |
| Capability Scenario table | 8 columns, **5 constant in this model** (Capabilities=1, Actors=1, Decisions=0…), and shows `1` where `Reading state` would fit |
| Neighbourhood graph | ~90px node boxes inside the drawer, while the full-width canvas sits dimmed behind it |
| URL | never changes — no deep link, no back button, refresh resets |

Inspector content height by kind, against a 929px panel viewport:

| Kind | Content | Sections |
| --- | --- | --- |
| Actor | 570px | Connections |
| Capability | 1067px | Intent, Access, Connections, Scenarios |
| Business rule | 1068px | Statement, Access, Connections |
| Capability Scenario | 1126px | Trigger, Steps, Outcome, Access, Connections |
| Screen | 1760px | Boundary, Information, Actions, States, Access, Connections |
| Journey Scenario | 2264px | Trigger, Flow, Routes, Steps, Outcome, Access, Connections |

No single container is right for both ends of that range. That is the whole of
the slideover-versus-page question, answered by measurement.

## Against the standard the repo already sets

`AGENTS.md` "Report viewer standards" says the rendered report *is a place you
go, not a document you read*, that *completeness is a cost, not a virtue*, and
that *the renderer's job is selection and ranking*.

`BlrInspectorDetail.vue` renders every authored field of every kind, in a fixed
order, at one visual level (`blr-inspector-heading`, `:498-503`, is the only
heading style). It selects nothing and ranks nothing. The comment at `:1-6`
states this as the intent — "complete, sectioned and relation-aware" — which is
the standard's stated failure mode, not its goal.

---

# Part 2 — Decisions

## D1. The rail lists kinds, flat. Containment lives where instances are.

**Reverses** the Workbench clause of the earlier plan's D1 and the code now in
the working tree: `RAIL_PARENT`/`RAIL_KINDS` at `BlrWorkbench.vue:78-90`, the
`item.child` binding at `:713-726` and `:1254-1267`, and `.blr-navchild` at
`:1346-1357`.

**Why it was wrong.** The rail lists *kinds*. Kinds do not nest — instances do.
Indenting 2 of 10 rows advertises a hierarchy the other rows also have: with
schema 5 the format declares a **complete** surface tree as well
(Interface → Experience → Screen). So the indentation is either incomplete
(2 rows nested, 3 more that equally deserve it) or it becomes a three-level
tree inside a ten-row rail. Neither reads. The user-facing complaint —
*"it doesn't make sense to put scenarios nested and experiences/screens not"* —
is precisely correct and cannot be fixed by nesting more.

**Why a tree rail is wrong even when the containment is real.** A tree of 68
entity instances is a slower ⌘K, and ⌘K already works (`BlrSearchPalette.vue`,
grouped by kind, ids shown). The rail's job is *which collection*, not *which
entity*.

**Decision.** One flat, ungrouped list of kinds under `Browse`, in the authored
order of `REPORT_ENTITY_KINDS` (`reportWorkspace.ts:83-99`), which already walks
the format: Actors, Interfaces, Experiences, Screens, Domains, Capabilities,
Journeys, Business rules. No indentation, no importance grouping — an
importance split (a "Product" versus "Structure" pair was considered) is
artificial: an Experience is no less part of the product than a Capability.

Result: 8 kind rows + Overview + Topology = 10 destinations, down from 12.

The format's two trees and one axis are expressed in the **order** of that list,
in the default grouping of each surface (D7), and on the entity pages (D3) —
not in rail decoration.

## D2. Scenarios are a tab on their parent's surface, not a destination.

`Capabilities (10) | Scenarios (24)` on the Capabilities surface.
`Journeys (4) | Scenarios (8)` on the Journeys surface.

This is the same resolution the docs already reached (`AGENTS.md:65-70`,
`docs/capabilities.md:115`, `docs/journeys.md:122`), applied to the Workbench.

It answers the objection recorded in the code comment at `BlrWorkbench.vue:70-77`
— that reading Scenarios only inside a parent would leave the largest collection
with no surface of its own. The tab **is** a surface of its own: the full
browse list, its facets (`entityFacets.ts:138-139`), its table, its grouping.
What it loses is a rail row that claimed Scenarios are a peer of Actors.

Requires a `scenariosByCapability` index. `reportWorkspace.ts:378` and
`:1029-1032` build `scenariosByJourney` only.

## D3. Every entity has a page. The slideover becomes a peek.

The measurement in Part 1 forbids one container. The rule:

- **Peek (slideover)** — fixed and short, never a scrolling document. Answers
  *"is this the one I meant?"* without leaving the list. Depth is always 1.
- **Page** — a real route, a breadcrumb, browser back. Answers *"tell me
  everything."* Full-width flow canvas, room for Steps, Routes, Product states.
- **A relation chip inside a peek navigates to that entity's page.** It does not
  re-target the peek forever.

That last clause is what removes the unbounded nesting. Today the panel
re-targets indefinitely; three deep the header is a bare `←`
(`BlrInspector.vue:119-127`), there is no trail, and the centre pane behind
shows an unrelated list. With D3, beyond depth 1 you are on pages, which have a
breadcrumb and a back button.

**The page shape already exists and is the best surface in the app**: the
Journey page at `BlrWorkbench.vue:1046-1113` — title, promise, availability,
relations as links, the flow canvas, then children as cards. Generalize it.

**The peek is four zones, in this order, and nothing else:**

1. **Identity** — kind, title, **qualified id**. The id is what distinguishes
   counterparts (`reader-web::personal-library::unread-library`); ⌘K already
   shows it and the cards do not.
2. **Lead** — one sentence.
3. **At most three facts, chosen to discriminate** — a Screen's scope, not its
   state count; a Scenario's parent and result.
4. **Connects to** — chips grouped by kind with counts, capped per kind, with
   `+N more` opening the page.

Then one action: `Open <kind> page →`.

**What moves out of the panel** (`BlrInspectorDetail.vue:302-455`): Rule
statement, Trigger, Flow, Routes, Steps, Decision points, Outcome, Edge cases,
Information presented, Available actions, Product states, Access and placement,
Supporting context, References. All of it belongs on a page with real heading
hierarchy.

**What is deleted**: the panel's own history stack and back button
(`BlrInspector.vue:44`, `:62-87`, `:119-127`). The browser's back button
replaces it, correctly, once D4 lands.

**Authored/Derived stops being the top-level split** of Connections
(`BlrInspectorDetail.vue:459-463`). Group by kind — the reader's question is
"what does this touch" — and mark derived provenance as a subtle attribute on
the chip. The distinction is real and must stay visible; it is not the primary
sort key.

## D4. Route state, and it is a host contract.

Required by D3 — pages without URLs are not pages.

`BusinessLensReportViewer.vue:23` already exposes `v-model:section`, and the
local host never binds it (`viewer/app/app/pages/index.vue:81`), so today the
URL never changes at all.

The layer stays host-agnostic: it exposes bindable state, hosts map it to their
router. Extend the contract from one model to two:

- `v-model:section` — `overview` | `topology` | an entity kind (exists).
- `v-model:entity` — `null`, or the qualified key of the open entity page.

The local viewer binds both to query parameters. The catalog host maps them to
whatever its routing allows. Both then get: deep links, browser back, and a
refresh that lands where you were — which `AGENTS.md` already demands under a
different name ("State must survive a recompile"; it currently survives a
recompile and does not survive F5).

## D5. One card layout. Delete the card-style switcher.

Ship `index` (`entityCards.ts:33-38`) as the only layout. It measurably reads
better than the `catalog` default: no repeated kind label, badge inline with the
title, full lead on one line, counts right-aligned.

Delete the control at `BlrWorkbench.vue:799-820` — a full toolbar row on every
surface, on every visit, carrying a design-audition choice. `AGENTS.md` places
auditions in `layers/nuxt/theme-lab/`; if `catalog` and `editorial` are worth
keeping, they belong there, not in the shipped chrome.

## D6. Filters collapse into one control.

`BlrWorkbench.vue:734-796` renders one `USelectMenu` per facet kind, always
visible: 7 above Capabilities, 7 above Screens, 7 above Journeys (4 items), 5
above Actors (2 items).

Replace with a single `Filter` button opening a popover of the same facets, plus
a chip per *active* filter. Hide the control entirely below a threshold
(~8 items) — a two-item list does not need faceting.

`facetKindsFor` (`entityFacets.ts:128-143`) is unchanged. This is presentation.

## D7. Every surface has a default grouping, and it is the format's own tree.

`groupEntities` already exists (`entityFacets.ts:186-215`) and grouping
Capabilities by Domain is the best list view in the app today — but `groupKind`
defaults to undefined for every kind (`BlrWorkbench.vue:130`, `:155-161`).

| Surface | Default grouping | From |
| --- | --- | --- |
| Screens | Interface | surface tree |
| Experiences | Interface | surface tree |
| Capabilities | Domain | subject axis |
| Capability Scenarios | Capability | behavior tree |
| Journey Scenarios | Journey | behavior tree |
| Business rules | Domain | subject axis |
| Actors, Interfaces, Domains, Journeys | none | roots |

**This is where the hierarchy the rail was asked to show actually lands** — over
instances, where the model has it, and dismissible in one click.

## D8. Counterparts, not accidental duplicates.

The Screens surface shows "Saved items" twice, "Source list" twice, "Unread
library" twice, with nothing on the card to tell them apart. They are not a bug
and not duplicates: they are counterparts, and the format says so on purpose
(`spec/format.md:177-181`).

Three changes:

1. The card's freed kind-label slot (D9) carries the scope:
   `Reader web application › Personal library`.
2. Screens group by Interface by default (D7), so counterparts sit in different
   groups rather than adjacent rows.
3. The Screen page cross-links its counterparts: *"Also on: Reader mobile
   application"*.

The layer cannot import `src/core/ids.ts`. Either add a five-line
`counterpartKey` to the layer's utils, or compute the grouping once in
`projectReportWorkspace`. Prefer the projection — it is where every other
derived relation already lives.

## D9. A card states its discriminating fact, not its kind.

The surface is already named after the kind; the card repeats it N times
(`BlrEntityCard.vue`). Free that slot:

| Kind | Slot carries |
| --- | --- |
| Screen | its scope (`Interface › Experience`) |
| Capability Scenario | its parent Capability |
| Journey Scenario | its parent Journey, and the result |
| Capability | its Domain |
| Journey | its Actor |
| Experience | its Interface |

The parent Capability is the single most useful fact about a Capability Scenario
and is currently absent from all 24 cards.

## D10. Tables name single-valued relations and drop constant columns.

`BlrWorkbench.vue:484-495`: the Capability Scenario table shows Capabilities and
Actors as counts. A Capability Scenario has exactly one Capability
(`relatedIds` returns `[entity.capabilityId]`, `entityFacets.ts:101`), so the
column is `1` on every row where `Reading state` would fit.

Rule: a relation that is single-valued by the format renders its **title**; a
column constant across the visible rows is not rendered. Same treatment for the
Journey Scenario table (`:496-509`).

## D11. Neighbourhood leaves the drawer.

`BlrInspector.vue:162-169` renders `BlrTopology` inside the 672px panel, where
node boxes are ~90px wide and unreadable — while the full-width topology canvas
sits behind it, dimmed and idle.

Make it a focus mode of the Topology destination: *Focus: Reading state*. The
peek links to it. `BlrProductTopology.vue` already owns named views with stated
derivations; a focus view is one more, and it is the one view that is currently
built and then hidden in a container that cannot show it.

## D12. The Overview shows the Journeys.

The Overview is four collapsed disclosures and a count strip
(`BlrWorkbench.vue:834-1043`), roughly 70% empty at 1600×1000. The four
Journeys *are* what the product promises; they are one click away behind a rail
row while `Model counts` gets a disclosure of its own.

Keep identity, Actors and the count line. Add the Journeys as first-class
content. Leave About / Coverage / Counts / References as disclosures.

## D13. Steal the Topology header for every surface.

`BlrProductTopology.vue` states each view's question and its derivation chain —
*"What can the product do, and how is that capability grouped?"* followed by
`ACTORS → INTERFACES → DOMAINS ⊃ CAPABILITIES`. It is the clearest thing in the
app and it exists on exactly one destination.

Every browse surface gets the same two lines: the question it answers, and the
derivation behind its default grouping. This is `AGENTS.md`'s "a named view
picks one, states its derivation, and is accountable for it", applied where the
reader spends most of their time.

---

# Part 3 — Open

## O1. Does the peek survive at all?

The alternative is that a click goes straight to the page and there is no
slideover. Simpler, and one less container to design.

**Recommendation: keep the peek.** The list-scanning case is real — "which of
these eight Screens did I mean" is answered without losing the list. But it
survives only under D3's constraint: fixed, short, non-scrolling, depth 1. A
peek that grows back into a document is worse than no peek.

## O2. What is on the page of a thin entity?

An Actor's inspector is 570px of content, and most of it is Connections. Its
page cannot be the Journey page with empty sections.

Options: (a) the peek is the whole thing for Actor, Interface, Experience and
Domain, and only heavy kinds get pages — but that reintroduces a per-kind
judgement call; (b) every page exists, and a thin one is identity + relations +
its neighbourhood graph, which is a genuinely good page for exactly these
kinds — an Actor's interesting content *is* its reach.

**Recommendation: (b).** One rule, and D11 gives the thin pages their body.

## O3. Route shape, and whether the catalog host can adopt it.

Query parameters are trivial for `viewer/app`. The catalog host serves
Blueprints under an existing path structure and may prefer path segments. The
layer must not care. Decide the two-model contract in D4 before either host
implements it, and confirm the catalog host can honour `v-model:entity` before
the peek starts linking to pages.

## O4. Where does the "Scenarios" tab sit relative to Topology?

`section` is currently one flat string (`BlrWorkbench.vue:93`,
`:101-118`). With D2 there are two sections per parent kind
(`capability` and `capability-scenario`), which the existing `WorkbenchSection`
union already spells. Confirm the tab writes the child kind to `section` — so a
Scenarios tab is deep-linkable — rather than holding local tab state.

---

# Part 4 — Confirmed defects, independent of the redesign

## P1. The inspector does not reset scroll when the entity changes.

Reproduced: Capabilities → *Reading state* → *Mark an item read* → *Unread
library* opens at `scrollTop: 503`, below the entity's own id, lead and facts.
The chip that was clicked sat low in the previous document; the panel body keeps
its offset across the entity swap.

`BlrInspector.vue:62-73` rehydrates history on entity change but nothing resets
the scroll container (`.overflow-y-auto` in the `USlideover` body).

This is most of the "the slideover is confusing" report: you land mid-document
with no title in view. Fix it now; D3 makes it moot later, but "later" is
several stages away.

## P2. No URL state at all.

Covered by D4, listed here because it is a defect in its own right: a reader
cannot link a colleague to a Capability, and F5 returns them to the Overview.

---

# Part 5 — Blast radius

## Files

| File | Change |
| --- | --- |
| `BlrWorkbench.vue` | D1, D2, D5, D6, D7, D12, D13. Largest file in the layer (1373 lines); the page extraction in D3 should reduce it. |
| `BlrInspector.vue` | D3 (peek), D11 (topology out), P1. History stack deleted. |
| `BlrInspectorDetail.vue` | D3. Most of its 504 lines move to page components. |
| `BlrEntityCard.vue` | D9. |
| `entityCards.ts` | D5 — variants reduced to one, or the file deleted. |
| `entityFacets.ts` | D7 — default grouping table. `facetKindsFor` unchanged. |
| `reportWorkspace.ts` | D2 (`scenariosByCapability`), D8 (counterpart grouping). |
| `BusinessLensReportViewer.vue` | D4 — second bindable model. |
| `viewer/app/app/pages/index.vue` | D4 — bind both to the route. |
| `BlrProductTopology.vue` | D11 — focus view. |
| new: entity page components | D3. |

## Documentation and release

- `CHANGELOG.md:25-27` claims *"Scenario rail items are indented under the
  Capability or Journey that owns them, so the navigation teaches the
  containment the format enforces."* Unreleased and reversed by D1 — rewrite,
  do not add a second entry contradicting the first.
- `plans/model-nesting-scenarios-and-assets.md:214-224` — the Workbench clause
  of D1. Add a pointer to this document rather than editing the record.
- `layers/nuxt/report-viewer/README.md` — describes the layer's surfaces.
- `docs/cli-view.md` (order 31) — the reader-facing description of what
  `businesslens view` opens. No new doc page: `docs/` stays flat with contiguous
  orders (`scripts/check-repo.mjs`), and this is not a new entity.
- `AGENTS.md` "Report viewer standards" — D3's peek/page rule is a standard, not
  an implementation detail. Add it there, in the register that already carries
  "named views, not a view builder".

## Not affected

`spec/format.md`, `spec/report.md`, the parser, the linter, the skills, the CLI
commands. This plan changes only how the projection is read.

---

# Part 6 — Operation path

Each stage is independently shippable and leaves `npm run verify` green.

## Stage 1 — Defects and subtraction (no new concepts)

1. P1: reset the panel scroll container on entity change.
2. D5: delete the card-style switcher; `index` becomes the only layout.
3. D6: collapse the filter row into one control with active-filter chips; hide
   below the threshold.
4. D9: cards state the discriminating fact instead of the kind.
5. D10: tables name single-valued relations; drop constant columns.

Removes two toolbar rows and the worst of the card noise before any structural
change. Verify against the Content Feed Reader Blueprint at 1600×1000 and
1180×900 — the narrow width is where the chrome currently wraps to four rows.

## Stage 2 — The rail and the parent tab

6. D1: flatten the rail; delete `RAIL_PARENT`, `RAIL_KINDS`' child mapping and
   `.blr-navchild`.
7. `reportWorkspace.ts`: add `scenariosByCapability`.
8. D2: Scenarios become a tab on the Capabilities and Journeys surfaces.
9. D7: default grouping per surface.
10. Rewrite `CHANGELOG.md:25-27`.

Answers the navigation complaint on its own, and is worth shipping even if
Stage 4 is deferred.

## Stage 3 — Routing

11. D4: second bindable model on `BusinessLensReportViewer`.
12. `viewer/app` binds both to query parameters.
13. Confirm O3 with the catalog host **before** Stage 4 starts.

## Stage 4 — Pages and the peek

14. Generalize the Journey page into an entity page for every kind (O2 option b).
15. D3: reduce the inspector to the four-zone peek; delete the history stack;
    relation chips navigate.
16. D11: neighbourhood becomes a Topology focus view; the peek links to it.
17. D8: counterpart grouping and cross-links on the Screen page.

The largest stage. It depends on Stage 3 — do not start it while the URL is
still constant.

## Stage 5 — Overview and framing

18. D12: the Overview shows the Journeys.
19. D13: every surface states its question and derivation.
20. `AGENTS.md`: record the peek/page rule as a standard.
21. `layers/nuxt/report-viewer/README.md` and `docs/cli-view.md`.

## Summary

The rail stops pretending to be a tree (D1, D2), the working view starts showing
the trees the format actually declares (D7, D8), the slideover stops being a
document (D3), and the URL starts existing (D4). Stages 1 and 2 are small,
independent, and remove most of what reads as mess today.
