# Model shape: two trees, one axis, and where assets live

Status: **implemented.** Stages 1–6 of the operation path are done and verified;
`npm run verify` is green (228 tests, repository and Blueprint checks). O1 was
resolved as `::`. Landing items L1, L3, L4, L5 and L6 are applied in the
`feat/markteplace` worktree; L2 (the entity grid layout) is not.

Follow-up revision: D4 now uses compact-or-expanded entities. The original
folder-for-every-entity rule proved needlessly noisy once exercised across the
complete teaching Blueprint; the revised decision is recorded below.

This document is now a record of what was decided and why. Part 6 records what
was actually built.

Scope: this repository (`businesslens/pdd`) and the landing repository
(`businesslens/landing`). Written against `pdd` branch
`codex/report-lab-topology-views` at `96185fa`, and the landing worktree
`feat/markteplace` at `9d8c648`
(`/Users/itaigendler/.superset/worktrees/5846c315-8b4a-4450-a578-29c249747e43/feat/markteplace`).

This document is deliberately explicit about file and line locations so it can
be picked up without the conversation that produced it. Line numbers are from
the revisions above and may drift.

**Part 1** is the shape of the model and the final folder layout. **Part 2**
records the decisions. **Part 3** is the one open question. **Part 4** carries
analysis the decisions did not change. **Part 5** is blast radius. **Part 6 is
the operation path** — start there to implement.

---

## Revision history

This document began as a review that recommended *against* nesting Experience
under Interface, *for* a mirrored `.businesslens/assets/` tree, and *for* a
storage split that kept implementation artifacts outside the model folder. All
three are reversed. What follows supersedes the earlier drafts; the reasoning
for each reversal is recorded with its decision so it is not relitigated.

| Earlier recommendation | Now |
| --- | --- |
| Capability/Journey are the only entity folders | **every entity can expand when it needs a namespace** (D4) |
| Experience may span Interfaces; do not nest | **Experience belongs to exactly one Interface; nest** (D2) |
| `.businesslens/assets/` mirrored tree | **co-location in the entity folder** (D8) |
| Domain groups Capabilities for navigation | **Domain is a subject axis over both trees** (D6) |
| Implementation artifacts live outside `.businesslens/` | **everything about the product lives with it; the profile filters** (D12) |
| A named `family` taxonomy correlates Experiences | **counterparts are the shared path suffix** (D11) |
| Ordered `screens:` on Interface/Experience | unchanged in intent, now **a local list of the folder's own children** (D9) |
| Keep both Scenario collections, stop teaching them as top-level | unchanged (D1) |

---

# Part 1 — The shape

## Two hierarchies and one axis

The flat ten-collection layout hides all three; the folder tree should show
them.

```
                    ┌──────────── Domain ────────────┐        subject: what it is about
                    │                                │
  Interface ⊃ Experience? ⊃ Screen          Capability ⊃ Capability Scenario
                                             Journey  ⊃ Journey Scenario

        surface: where the product is          behavior: what the product does

  Actors (who) · Business Rules (constraints)          cross-cutting, flat
```

`availability` is the join between the two trees. Domain classifies members of
both. Actors and Business Rules attach across everything.

This is the teachable sentence the docs and the Workbench rail should both
follow, and neither does today: `docs/product-model.md:22-35`, the rail at
`layers/nuxt/report-viewer/app/components/BlrWorkbench.vue:74`, and the folder
layout at `spec/format.md:44-66` each present a different shape.

## The final layout

```
.businesslens/
├── config.yaml · taxonomies.yaml · coverage.md · README.md · .gitignore
├── build/ · cache/                                 generated, gitignored
│
├── product.md                                      compact when there is no logo
├── product/                                        expanded alternative
│   ├── product.md
│   └── logo.svg                                    the product's logo, not the model's
│
├── actors/<id>.md
│
│   ── surface tree ──
├── interfaces/<id>/
│   ├── interface.md
│   ├── screens/<id>.md                             when no Experience is justified
│   └── experiences/<id>/
│       ├── experience.md
│       └── screens/<id>/
│           ├── screen.md
│           ├── mockup.png                          authored — travels
│           └── implementation/                     this realization — stays home
│               └── overview-dark.png
│
│   ── subject axis ──
├── domains/<id>.md
│
│   ── behavior tree ──
├── capabilities/<id>/
│   ├── capability.md
│   └── scenarios/<id>.md
├── journeys/<id>/
│   ├── journey.md
│   └── scenarios/<id>.md
│
└── business-rules/<id>.md
```

`config.yaml`, `taxonomies.yaml` and `coverage.md` stay at the root: they are
model-level files, not entities.

Typed intermediate directories (`experiences/`, `screens`, `scenarios`) remain
because they express parent relations. Leaf entities do not add another
directory unless they own assets. This keeps the semantic tree without paying
an empty-wrapper cost at every leaf.

## Three principles the decisions keep reaching for

**1. The path owns classification.** Parent relations (D5), ids (D7),
counterparts (D11) and asset class (D13) are all read from where a file sits,
not from what its frontmatter claims. One authority instead of two that can
disagree, and reparenting becomes a `git mv` that reads correctly in a pull
request. This matters most where a *foreign tool* writes the content — nothing
will edit BusinessLens frontmatter on a CI run, so the path is the only
authority that can work.

**2. A container may declare only a subset of what already resolves.** Domain
(D6), reading order (D9) and asset metadata (D14) all follow this: the relation
is derived, and an optional authored list may narrow or order it but never
create it. Declaration is always optional and never an error to omit.

**3. Model it only when lint can say something specific.** A field or entity
earns its place when a checker can produce a useful message about it — "this
Screen's declared domain isn't in its derived set," "this asset names a Product
state that doesn't exist." When the only possible message is "unknown key," it
does not belong in the model.

## What this model deliberately does not have

**No tags, labels, or free-form key/value metadata.** A generic label mechanism
was designed and rejected. Three reasons, in order of weight:

- **Nothing could consume it.** `app/utils/entityFacets.ts:9-11` states its own
  contract — *"Nothing here derives new relations: a facet is only ever an id
  array the projection already holds."* A key/value pair is not an id array, so
  filtering by one would need a second, non-relational facet path built first.
- **It fails principle 3.** Lint could only ever say "unknown key."
- **Unvalidated vocabulary defeats the catalog.** A Blueprint's value is that
  models are comparable; per-model vocabulary is not.

Grouping needs that are genuinely not subject matter — team ownership,
compliance scope, maturity — stay in whatever system already tracks them.
Note also that `spec/format.md:382` already forbids the most-requested ones:
*"Availability states intended Product scope, never implementation status."*

If real pressure appears later, the answer is a *modeled* field that passes
principle 3, not a generic bag.

---

# Part 2 — Decisions

## D1. Keep both Scenario collections; stop teaching them as top-level entities

Capability Scenario and Journey Scenario are the only two entity types with
exactly one mandatory parent (`spec/format.md:706`, `:808`); presenting them as
peers of the unowned types contradicts the format's own shape.

Do **not** reverse the split. Two real mappings produced opposite failures from
the same cause: **Gitea** invented one-Capability wrapper Journeys so Capability
behavior could have Scenarios at all, and **Argo CD** avoided those wrappers by
over-broadening Journeys to cover several unrelated administration Capabilities.
Both passed lint. A merged collection reintroduces exactly that ambiguity. Embedding Scenarios in their parent's Markdown is also wrong — they
would lose ids, lose targetability by Business Rules (`spec/format.md:497`) and
Screens (`:525`), lose per-Scenario `references`, and fold 21 Capability
Scenarios into 10 files in the golden Blueprint.

**Docs:** merge `docs/capability-scenarios.md` (order 15) and
`docs/journey-scenarios.md` (order 17) into one `docs/scenarios.md`, opening
with the containment rule, then two labelled halves preserving the per-kind
field tables.

Place it at **order 16, after `journeys.md`**, so both parents are introduced
before the child that belongs to either. Verified current orders and the
resulting renumber for `scripts/check-repo.mjs` contiguity:

| Page | Now | After |
| --- | --- | --- |
| `capabilities.md` | 14 | 14 |
| `capability-scenarios.md` | 15 | *deleted* |
| `journeys.md` | 16 | **15** |
| `scenarios.md` | — | **16** |
| `journey-scenarios.md` | 17 | *deleted* |
| `business-rules.md` | 18 | 17 |
| `references.md` | 19 | 18 |
| `feed-reader-example.md` … `cli-contribute.md` | 20 … 37 | 19 … 36 |

Update `docs/product-model.md` and cross-links in `docs/capabilities.md`,
`docs/journeys.md`, `docs/screens.md`, `docs/business-rules.md`. This satisfies
the AGENTS.md rule "each entity is explained in exactly one place" — one page per
*concept*, and the concept is Scenario. **Side effect: fixes the landing 404 in
§L1.**

**Workbench:** *superseded — see `plans/report-viewer-navigation-and-depth.md`
D1.* The indentation shipped and was then reversed: the rail lists kinds, kinds
do not nest, and with schema 5 declaring a full surface tree as well, indenting
two rows was either incomplete or a three-level tree inside a ten-row rail. Both
Scenario kinds are now a tab on their parent's collection, which is the
resolution the docs clause above reached for documentation. The original text
follows.

~~indent `capability-scenario` and `journey-scenario` as child rail
items under Capabilities and Journeys rather than flattening all ten kinds.~~ The
comment at `BlrWorkbench.vue:69-73` defends flattening because Scenarios would
otherwise be the largest collection with no browse surface — that objection is
answered by indenting, not by flattening. They stay clickable and keep their
facets (`app/utils/entityFacets.ts:135-136`).
`app/utils/reportWorkspace.ts:91-98` already collapses both kinds onto one colour
slot ("the two that belong to one family are the honest pair to merge"), and the
parent-aware drilldown already exists
(`app/components/BlrWorkbenchScenarioDrilldown.vue`).

## D2. An Experience belongs to exactly one Interface

`experiences[].interfaces` becomes a single `interface`, derived from the path.

**Rationale.** A named context on the web and the "same" context on mobile share
a goal but are not the same thing: different screens, different reach, different
affordances. Modeling them as one entity forces a single file to describe two
things and hides divergence between them.

**The payoff is bigger than the nesting.** Once an Experience id implies its
Interface, a scope is a single string, and four of the fiddliest rules in the
format collapse together:

```yaml
# today — nested, two shapes, plus a rule forbidding their mixture
availability:
  - interface: reader-web
    experiences: [personal-library]
  - interface: reader-mobile
    experiences: [personal-library]

# after
availability: [reader-web::personal-library, reader-mobile::personal-library]
```

```yaml
# today — exact context, two fields, one conditional     # after
interface: reader-web                                    context: reader-web::personal-library
experience: personal-library
```

Removed by this collapse:

- the nested `availability` record shape (`spec/format.md:367-382`)
- the `experiences` sub-list, which no model in this repo ever populated with
  more than one value
- "Omit `experience` only when the Interface has no Experiences" (`:399`)
- "An Interface cannot mix direct and Experience-scoped availability" (`:381`)
  as a *rule* — it becomes a property of whether a scope id resolves in the tree

This applies simultaneously to Capability, Screen, Capability Scenario, Journey
Scenario routes, and Business Rule targets. **Lead the ADR with this**, not with
folders — it is the change that pays for the rest.

## D3. An Interface does not require an Experience

A Screen sits directly on an Interface when no Experience is justified. This
keeps `spec/format.md:353` ("an Interface with one undivided usage context does
not need a ceremonial Experience").

**Keep the no-mixing rule.** Within one Interface it is either `screens/` or
`experiences/`, never both — otherwise the scope id `reader-web` is ambiguous
between "the whole Interface" and "the part of it with no Experience". The rule
survives as a path-shape lint finding instead of an availability rule.

Introducing an Experience into an Interface that had direct Screens is a
`git mv` of that Interface's screens. That is the same amount of change as
today's availability edit on every screen, made visible in the diff instead of
buried in frontmatter — the same argument as D5.

## D4. An entity expands only when it needs a namespace

Canonical rule:

> Use `<id>.md` while an entity has no assets or child entities. When it gains
> the first one, move it to `<id>/<type>.md`; assets sit beside that file and
> children use typed subdirectories.

Both forms derive the same logical id and may not coexist. An expanded entity
with no assets or children is invalid and compacts again. This preserves the
path-owned tree and asset co-location without forcing every Actor, Domain,
Business Rule, Scenario, and assetless Screen to live alone in a directory.

The cost is one visible `git mv` when the first asset or child arrives. That is
rarer and cheaper than permanent authoring and navigation noise. Keeping a flat
file plus a same-stem sidecar directory was rejected because it duplicates the
entity name and creates two simultaneous homes; promotion keeps one authority.

`<type>.md` rather than `index.md` remains the expanded filename because it
greps unambiguously and cannot be mistaken for a child. Product follows the
same rule: `product.md` without a logo, or `product/product.md` beside
`product/logo.svg` when expanded.

## D5. The path owns the parent relation

Remove `capability:` from Capability Scenario frontmatter, `journey:` from
Journey Scenario frontmatter, and `interfaces:` from Experience frontmatter.

- One authority instead of two that can disagree — the principle
  `spec/format.md:76` already states for ids.
- Reparenting becomes `git mv`, which reads correctly in a pull request. Today
  it is an invisible one-word frontmatter edit.
- A whole class of lint error (dangling parent id) disappears by construction.

This is the same principle D7, D11 and D13 apply to ids, counterparts, and asset
class. **Where a foreign tool writes the content, the path is the only authority
that can work** — nothing will edit BusinessLens frontmatter on a CI run.

## D6. Domain is a subject axis, not a level in the behavior tree

`spec/format.md:404-406` currently defines Domain as a navigational grouping of
Capabilities — the only entity in the model defined by *what it groups* rather
than *what it is*. It has no boundary statement, no vocabulary, and `:454`
actively pushes it toward being a junk drawer ("use an optional Domain for their
umbrella").

The Blueprint's own Domain prose is already better than the spec: *"Sources — the
supported source lifecycle: which feeds a Reader follows and how their new items
enter the private library without erasing durable history."* That is a region of
subject matter with an invariant, not a folder label.

**Changes:**

1. Redefine: *a Domain is a coherent region of the product's subject matter — its
   own vocabulary, its own invariants.* Add a required `## Boundary` section so
   it is a real entity lint can check.
2. **Capability keeps its authored `domain:` — optional, single, unchanged.**
   This is still how related Capabilities are grouped and it is the *only*
   authored Domain edge in the model. Single rather than many is deliberate: if
   a Capability is about two subject regions, either a `## Boundary` is wrong or
   the Capability should split.
3. **Everything else derives.** A Screen's, Experience's, or Journey's Domains
   resolve through their Capabilities. Do not add `domain:` to Screen — that is
   a second source of truth that can contradict the first, the same failure D5
   removes for Scenario parents. Measured on the golden Blueprint, all five
   Screens resolve to exactly one Domain through their Capabilities, and the two
   Experiences resolve to three and one respectively.
4. A container may *declare* only a subset of what already resolves. If a Screen
   states a primary `domain:`, lint requires it to be in the derived set.
5. Delete the umbrella advice at `:454`. Splitting `manage-repositories` into
   four Capabilities does not create a need for a Domain; those four were
   already about the Repositories domain before the split.
6. Keep Domain **flat**. An axis classifies; it does not contain. Do not nest
   Capability under Domain — the relation is optional and single, so nesting
   forces a permanent unassigned bucket.

**Grouping Capabilities after this change.** The old model had one grouping
mechanism doing several jobs badly. Three remain, each answering a different
question:

| Question | Mechanism | Authored on |
| --- | --- | --- |
| What is it about? | **Domain** | Capability `domain:` |
| Where can you reach it? | availability scope ids (D2) | Capability `availability:` |
| What does it participate in over time? | **Journey** | Journey Scenario flow |

All three already work in the Workbench without new code:
`app/utils/entityFacets.ts:189-199` groups any kind by any related kind and
emits an explicit unassigned bucket, which is exactly what an optional `domain:`
needs.

Grouping by anything that is *not* one of these three — team ownership,
compliance scope, maturity — has **no home in the model and should not get
one**. See "What this model deliberately does not have" in Part 1.

**Payoff:** "Domains" stops being a rail item that duplicates the Capability
list and becomes the one view that answers *"show me everything about
Collections"* across both trees — Capabilities, Scenarios, Screens, Journeys,
Rules.

## D7. Ids are path-derived; surface-tree ids are qualified

Extend `spec/format.md:76` from "ID = filename stem" to **"ID = the path from the
collection root."**

Surface-tree entities legitimately repeat names across Interfaces, so their ids
carry the path:

```
reader-web
reader-web::personal-library
reader-web::personal-library::unread-library
partner-api::webhook-receipt
```

Behavior-tree ids (Capability, Journey, both Scenario kinds) stay bare and
globally unique — those collections have no repetition pressure, Business Rule
`appliesTo` targets and report routes address them by bare id, and per-parent
uniqueness would break both for no gain.

Cost to accept: Business Rule `appliesTo` and Screen back-references get longer.
That is the honest price of surfaces being distinct, and it is greppable, which
bare ids stop being once names repeat.

Separator: **see O1.**

## D8. Assets co-locate in the entity folder

A mirror of a hierarchy drifts from the hierarchy; co-location cannot. Every
entity kind can expand (D4), so this works uniformly for all ten kinds rather
than only for the kinds that already own children.

Reuses the hardening rules already written for `logo.svg`
(`spec/format.md:211-215`): self-contained, size-capped, no active content, no
network references, rendered as an image only. `logo.svg` is the existing
precedent that the model folder can hold an asset.

Refined by D12 (what "co-locate" includes), D13 (how class is declared), and D14
(metadata).

## D9. Optional ordered `screens:` list, local to the folder

Today the only order is `.sort()` on filenames (`src/core/model.ts:192`). The
need is real: the landing screenshot manifest carries an explicit per-screen
`order:` (`docs/design/ui/screenshots/manifest.yml`, values 1, 5, 6, 10 …)
because the model did not provide one, and the catalog card artwork takes
`MAX_SCREENS = 4` per surface in model order with no way to say which four
matter (landing `server/catalog/artwork.ts:24`).

Rejected: an `order:` integer on the Screen (one number cannot be right in every
context) and making the list the relation authority (inverts authority, two
sources of truth).

Accepted: an optional ordered `screens:` list in `interface.md` or
`experience.md` naming **its own children**, sitting directly above the folder it
orders. Reachability stays with the tree; the list declares *reading order* only.
Lint: every entry resolves to a child, entries are unique, unlisted children sort
after alphabetically. Never an error to omit.

This narrows `spec/format.md:597` ("Screens do not author a sitemap") rather than
reversing it: still no transition graph, but a declared reading order per
surface. It also makes the landing card artwork deterministic, which it
currently is not.

## D10. Retained rules that decisions above did not weaken

- **A Screen omits its Experience only when its Interface declares none**
  (`spec/format.md:376-381`). This is what prevents an Interface Actor from
  becoming unreachable (`:356-359`). Under D2/D3 it becomes a property of the
  tree rather than a rule.
- **System and legal screens are not Screens.** `spec/format.md:569` requires at
  least one Capability; landing's `SYS-01.not-found` and its privacy page have
  none, while landing's own rule is "every implemented page route must appear
  here." Document the exclusion in `docs/screens.md` ("error, legal and other
  capability-free views are not Screens; model them as Product states of the view
  they interrupt, or leave them out") rather than weakening the constraint.
- **Reference targets resolve repository-relative** (`spec/format.md:150`), not
  model-relative. Nesting does not shorten them. Do not add model-relative
  resolution as a second accepted form — one resolution rule is worth more than
  short strings.
- **Product Report v8 does not change** for D2/D5. Export still emits the parent
  ids; the parser reads them from the path instead of frontmatter. The round-trip
  guarantee in `spec/report.md` is preserved.
- **Themes are not Product states** (`spec/format.md:586-591`). Light and dark
  captures of one state are two assets sharing one `state`, not two states.

## D11. Counterparts are the shared path suffix below the Interface

D2 makes an Experience single-Interface. This is how the model states that
`personal-library` on web and on mobile pursue the same goal while remaining
different entities.

> **Counterparts are entities of the same kind that share the same path suffix
> below their Interface.**

```
reader-web::personal-library::unread-library
reader-mobile::personal-library::unread-library     ← counterparts, suffix matches
```

No entity, no taxonomy entry, no `family:` field. The path already encodes it,
consistent with D5 and D7. `find . -path '*personal-library*'` finds the family.

A named `family` taxonomy was proposed and **withdrawn**. This shape meets the
same three requirements at zero cost:

- **Thin by construction** — there is nothing to fill in, so it cannot grow back
  into the cross-Interface Experience D2 removed.
- **Cardinality is free** — a directory cannot hold two children with the same
  name, so "at most one member per Interface" is enforced by the filesystem, not
  by lint. Matching on the *suffix* rather than the last segment is what makes
  this correct for nested Screens: `personal-library::foo` and `checkout::foo`
  in the same Interface have different suffixes and are correctly not
  counterparts.
- **Generalizes to Screens** automatically — same rule, no extra surface.

Two consequences accepted deliberately:

- It **forces counterparts to be named identically.** That is a feature: if web
  says `personal-library` and mobile says `my-library`, the inconsistency is
  itself worth surfacing.
- **Escape hatch when names genuinely must differ:** an optional `counterpartOf:`
  naming another entity of the same kind in a different Interface. Rarely used.

There is no shared goal statement and there should not be. Each Experience has
its own lead description and `## Capability boundary`; if two are counterparts,
reading either tells you the goal. A shared sentence is the thin end of the wedge
back to the entity D2 removed.

**Lint:** warn when counterparts diverge in `actors` or `access` — *"these claim
the same goal but serve different audiences."*

## D12. Location expresses relatedness; profile expresses what travels

> **They are independent.** Everything about the product — authored or
> generated — lives next to the entity it is about. What is published is decided
> by the projection, not by where the file sits.

This reverses an earlier draft that kept implementation artifacts outside
`.businesslens/` *because* they do not travel. That is the category error the
Terms section of `spec/format.md` names:

> Redaction is a property a report has, never a category it belongs to.

The same section defines **Product Model** as `.businesslens/` and **Product
Report** as its serialization in one of two profiles
(`referenceProfile: workspace|portable`). The Blueprint is one profile of one
report — one capability, not the storage contract. A future full-model product
for customers stores the whole model *including* implementation assets, and must
not be blocked by a storage rule inherited from what the public catalog happens
to accept.

Precedent: `build/` and `cache/` are generated content already living inside
`.businesslens/`, gitignored by model-creation workflows
(`spec/report.md` Generated files). Tool-written content in the model folder is
established, not novel.

## D13. `implementation/` is a reserved subdirectory inside the entity folder

Class is declared by the path, not by frontmatter:

```
interfaces/reader-web/experiences/personal-library/screens/unread-library/
├── screen.md
├── mockup.png                    ← authored intent — travels
├── screen-map.md                 ← authored context — travels
└── implementation/               ← this realization — workspace profile only
    ├── overview-light.png
    ├── overview-dark.png
    └── journeys-dark.png
```

**The decisive criterion is tool-writability.** These files are regenerated by a
test run. Any mechanism that requires a human or a BusinessLens-aware tool to
edit frontmatter when a screenshot changes will rot on the first CI run. Only the
path can classify content a foreign tool produces — the same reasoning as D5,
D7 and D11.

Alternatives rejected:

| Mechanism | Works for tool-written files |
| --- | --- |
| frontmatter `assets:` list with `role:` per file | no — every regenerated file needs an edit |
| filename convention (`overview.impl.png`) | partly — Playwright names snapshots after the test |
| per-folder manifest | no — same failure, plus a new file type |
| class declared per entity-kind in `config.yaml` | yes, but a file's class is invisible when looking at it |
| a mirrored artifacts root | drifts, which is why D8 exists |

Named `implementation/` rather than `artifacts/` or `generated/` so it matches
the existing `role: implementation` vocabulary — the projection rule becomes one
sentence covering both mechanisms, and it is already true for references at
`spec/report.md`: *"`intent` and `context` describe the product and travel
with a published Blueprint; `implementation` describes this repository's
realization of it and stays home."* The filter is a path prefix.

**Consequences to handle:**

- **`--force` backup size.** `.businesslens.backup-<ts>/` now copies binaries.
  Either warn on size or exclude `implementation/`, which is regenerable.
- **Default `.gitignore`.** `build/` and `cache/` are gitignored;
  `implementation/` must **not** be — the whole point is that a customer's full
  model includes it. State this explicitly in `spec/report.md` so it is
  not swept in by analogy.
- **The write-nothing-outside invariant is unaffected** — it constrains what
  BusinessLens writes, not what other tools write into the model folder. Add a
  sentence to AGENTS.md saying so; the inverse reading is available and someone
  will make it.
- **Export carries no assets initially.** Deliberate. The directory ships now
  regardless, because it costs nothing and prevents having to untangle mixed flat
  folders in existing models later.

## D14. The optional `assets:` list carries metadata only, never class

```yaml
assets:
  - file: implementation/journeys-dark.png
    state: Journeys              # validated against this Screen's H3 Product states
    title: Journeys tab, dark
```

- Class comes from the path (D13). The list never sets it.
- **Unlisted files are legal.** A tool dropping a new file in never breaks
  anything; you annotate only what needs annotating.
- `state:` is a **real field**, and only on Screens: the format models Product
  states as H3 sections (`spec/format.md:554-562`), so lint can check that it
  resolves — which is why it earns a field at all (Part 1, principle 3). This
  replaces the earlier proposal for a generic closed-vocabulary reference
  `scope` object with one optional field.
- Theme is not modeled (D10). Two assets, same `state`, distinguished by title.
- Per-asset order is the list order; it is already authored order.
- Third use of the *declare only a subset of what already resolves* idiom,
  alongside D6 and D9.

**This retires the landing screenshot manifest almost entirely:** `route:` →
`entryPoints`, `document:` → a reference, `order:` → D9, stable ids → `state:`
plus filenames.

## D15. `references` are pointers to what the model does not own

With D8/D12/D13 in place, the two mechanisms separate cleanly:

- **Assets** are files inside the entity folder. No `references` entry needed —
  `kind` is derivable from the extension and class from the path.
- **References** point outward: external URLs, repository code, ADRs, vendor
  specs, architecture docs. They keep `{kind, role, target, title?}` unchanged.

Today one list mixes both classes and `role` carries the whole burden of telling
them apart. After this, *location* carries it and `role` describes what kind of
pointer it is. All three role values stay meaningful — a Figma link is `intent`
but not model-owned.

**Document the projection consequence on the role table.**
`docs/references.md:47-53` defines the three roles and says nothing about which
survive publication; that consequence is buried in `docs/cli-export.md`.

## D16. A section is visualizable only when four things align

The format already has a two-tier section model, and it is the mechanism by
which an entity document renders as something other than a wall of prose:

- **Recognized H2** → a typed field on the report entity → a bespoke component.
- **Unrecognized H2** → the ordered `supportingSections` array
  (`src/core/portable.ts:68,297`) → one generic markdown blob via
  `supportingMarkdown()` (`app/utils/reportWorkspace.ts:634-1031`).

`validateSupportingSections` (`src/core/portable.ts:529+`) enforces the
separation: a recognized name may not appear in the supporting bag.

**"Render it nicely in the UI" therefore means "make it recognized," and that
requires all four of:**

| | What | Where |
| --- | --- | --- |
| 1 | a recognized H2 name, per entity kind | `spec/format.md` |
| 2 | **a required content shape** — bullet list, H3 + prose, or prose | `spec/format.md`, enforced by `lint` |
| 3 | a typed field on the report entity | `src/core/portable.ts` |
| 4 | a component that reads that field | `layers/nuxt/report-viewer/app/components/` |

**(2) is the one that gets skipped, and it is the one that makes visualization
possible.** A section with no declared shape can only ever render as prose.
Screen already demonstrates all three shapes (`spec/format.md:540-577`):
`## Information presented` must be a bullet list, so it renders as a list;
`## Product states` is H3 + prose, so it can render as an accordion or a state
matrix; `## Capability boundary` is prose, so it renders as a callout.

**The test for formalizing a new section is principle 3 from Part 1:** *can the UI
render it differently from prose?* If yes, formalize it — all four rows. If no,
leave it in `supportingSections`, where it still round-trips losslessly. That
lossless bag is what makes the strictness affordable: authors are never blocked
from writing a section the format has not anticipated.

**Two consequences for the asset work:**

- A co-located `.md` asset (`screen-map.md` beside `screen.md`) is not an entity
  section and gets no typed field. The viewer should render it inline or in a
  drawer rather than link to it — decide this with P1, since both need the same
  local-file mount.
- D14's `state:` is exactly what lets the UI place the right capture beside the
  right `## Product states` H3. That pairing is the concrete visualization
  payoff of the whole asset design, and it is blocked today by P1: `BlrRefs.vue`
  renders local targets as inert `<span>` text.

---

# Part 3 — Open

## O1. Id separator — resolved as `::`

`::` was chosen over `/` for the qualified surface-tree ids in D7.

- `::` — avoids URL encoding in report routes, which address entities by id, and
  matches the `parent::child` node-key convention already used in the viewer.
- `/` — more honest if ids are to read as paths.

It avoids URL encoding in report routes, which address entities by id, and it
matches the `parent::child` node-key convention already used in the viewer. It
is encoded in `src/core/ids.ts`, the report's `SurfaceIdSchema`, every lint
message, and both models.

**Not done: L2, the landing entity grid.** `app/utils/homeContent.ts` still
renders nine flat cards where `docs/adr/0009` argues for eight with Scenarios as
a child affordance under Capabilities and Journeys. The card data is a flat
list, so the change needs component work rather than a data edit, and it is
independent of everything else here.

---

# Part 4 — Analysis unchanged by the decisions

## P1. Rendering assets in `businesslens view`

Two blockers, both self-contained, both shippable before any format change:

**The viewer renders local targets as inert text.**
`layers/nuxt/report-viewer/app/components/BlrRefs.vue:31,46` makes an `<a>` only
when the target matches `^https?://`; anything else renders as a `<span>`. A
local image reference is dead text. Fix: render `kind: visual` local targets as
thumbnails that open full size; render other local kinds as links into the
served mount below.

**The local server cannot reach repository files.**
`src/core/local-viewer-server.ts:217-227` resolves only within the bundled viewer
root and guards against traversal. Fix: add a second read-only mount rooted at
the repository, extension-allowlisted to the MIME map already at `:23`, keeping
the existing traversal guard. Repository-root rather than `.businesslens/`-only,
because reference targets are repository-relative (D10) and referenced
implementation artifacts still legitimately live outside the model folder.

This gains urgency under D8: co-located assets are the common case, and a model
full of images that render as dead text is worse than one with none.

## P2. Can the portable report carry binaries

**Downgraded.** The original item — "resolve don't delete for portable assets" —
existed because repository-relative product assets were dropped by the portable
projection (`spec/report.md` Portable projection), so a published Blueprint of a visual
product carried no visuals. The proposed fix was to rewrite targets to
commit-pinned Git URLs, which reveals the origin repository and so breaks the
guarantee that a portable report carries no repository-specific material.

**D8 dissolves that.** Authored assets now live inside the model, so they are
inside the export by construction — no URL rewriting, no origin disclosure,
nothing reopened.

What remains is one narrow question: **can a Product Report physically carry
binary content?** It is a single JSON document today. Options are base64 inlining
(bloat), shipping a Blueprint as a directory (changes the wire contract), or
publishing assets to a URL (which discloses an origin after all).

**Decision for now: export carries no assets.** Revisit when there is a
concrete need. This unblocks D8 completely.

## P3. Independent bug to fix regardless

`src/core/model.ts:192`:

```ts
return readdirSync(directory).filter(name => name.endsWith('.md')).sort()
```

Non-recursive, and directory entries are silently dropped. A file nested in a
subdirectory today vanishes from the model with no lint finding. Under D4 the
loader must walk directories anyway; an unexpected entry — a stray file, an
unknown subdirectory that is neither a typed child nor `implementation/` — should
become an explicit finding rather than silence.

## P4. Visualization payoff

The topology engine has no containment primitive.
`layers/nuxt/report-viewer/app/utils/productTopologyViews.ts` models flows and
shelves; `BlrFlowGroup.vue` draws lanes. Authored containment edges would let
"Product map" become a genuine collapsible tree —
`Interface ⊃ Experience ⊃ Screen`, `Capability ⊃ Capability Scenario`,
`Journey ⊃ Journey Scenario` — with Domain as a cross-cutting filter rather than
a shelf.

The `sitemap` view is already `Product → Interfaces → Experiences → Screens`
with `semantics: 'occurrence'` (`:88-101`). Under D2 the occurrence semantics
become unnecessary: nothing repeats, because nothing is shared. Counterparts
(D11) become the interesting cross-surface overlay instead.

## P5. Landing → model mapping

| Landing artifact | Model entity | Fit |
| --- | --- | --- |
| the site + the `pull` catalog API | 2 Interfaces | good — the CLI *initiates*, so the API is inbound and the puller is its Actor (`spec/format.md` Outbound dependencies) |
| `docs/design/experiences/*.md` | Experiences with `access:` | strong — the catalog artwork already treats Experience as the surface |
| the "Who does what" tables | Actors | good |
| `docs/design/ui/*-screens.md` | Screens | good |
| `CAT-02`'s `?tab=` variants | `## Product states` | good — tabs change what the user understands |
| manifest `order:` | — | **now has a home** → D9 |
| manifest `route:` | Screen `entryPoints` | good |
| manifest `document:` | `kind: doc, role: intent` | good |
| screenshot PNGs | assets under `implementation/` | **now co-located** → D13 |
| screenshot state ids | asset `state:` | → D14 |
| `tests/e2e/*.spec.ts` | `kind: code, role: implementation` reference on Scenarios | best fit in the mapping |
| `docs/adr/*` | `kind: adr, role: context` | good |
| `docs/design/architecture/*` | not model content; `role: context` references | good |
| `SYS-01.not-found`, privacy page | — | **cannot be Screens** → D10 |

## P6. Landing repository work items

Verified against the `feat/markteplace` worktree at `9d8c648`. **Already fixed
there — do not re-report:** `report.counts.scenarios` and the removed
`businesslens/report/view-model` import.

**L1. `/docs/scenarios` is a 404.** `app/utils/homeContent.ts:785` links the
Scenarios card to `/docs/scenarios`. Docs are pulled straight from `pdd/docs` at
`/docs/<stem>` (`content.config.ts`), and no `docs/scenarios.md` exists. D1
creates it.

**L2. The entity grid contradicts its own ADR.**
`app/utils/homeContent.ts:762,776-787` renders nine flat cards ("Nine entities,
so three rows of three").
`docs/adr/0009-the-home-page-teaches-all-eight-entities.md` explicitly considered
and rejected that layout: *"The eight in a flat grid… discards the containment —
and the containment is the insight."* Recommend eight top-level cards with
Scenarios as a child affordance under Capabilities and Journeys. Also update the
ADR's title and body, which still say "eight" while nine shipped.

**L3. Vocabulary drift from the format.**

| Location | Says | Should say |
| --- | --- | --- |
| `app/utils/faqContent.ts:78` | "actors, experiences, domains, **features**, journeys, scenarios, business rules" | Capabilities; and it omits Interfaces and Screens |
| `app/utils/faqContent.ts:39` | "the actors, journeys, rules, and scenarios" | omits Capabilities — the behavioral core |
| `app/pages/blueprints/index.vue` | "actors, journeys, scenarios, and the rules" | Capabilities absent |
| `app/components/landing/hero/MapHero.vue:74`, `app/pages/index.vue:42` | "…domains, features, journeys…" | Capabilities |
| `content/blog/*.md` (three posts) | "features", Capabilities absent | Capabilities |

`docs/adr/0012-public-terminology-lives-with-entities.md` makes the pdd entity
pages the authority and requires vocabulary changes to review `CONTEXT.md` and
the pdd pages together. That process did not run for the Scenario split.

**L4. Add a build check** asserting every entity card `to:` in `homeContent.ts`
resolves to a real `pdd/docs/*.md` stem. The `/docs/scenarios` 404 would have
been caught at build time.

**L5. The card artwork counts zero Journeys per Experience.**
`server/catalog/artwork.ts:81-84` walks
`scenario.flow[].availability[].experienceIds`. In Report v8,
`ReportJourneyFlowItemSchema` is a `strictObject` of
`{id, capabilityId, operation}` — flow entries carry no availability; contexts
live on `routes[].contexts[]` (`pdd/src/core/portable.ts:228-242`). So
`journeysByExperience` returns an empty map for every real v8 report and no card
ever draws as a `list`. The code targets a shape the shipped format superseded.
Fix: derive per-Experience Journey reach from `routes[].contexts[].experienceId`.

**L6. Media type version mismatch.** `shared/contracts/blueprints.ts:6` pins
`version=7` while line 49 binds `ProductReportV8Schema`.

---

# Part 5 — Blast radius

## Blast radius of the schema-5 change

- `src/core/model.ts:190` — `listMarkdown` gains directory levels and must walk
  the surface tree; see also P3.
- `src/core/model.ts` — every entity loads from compact `<id>.md` or expanded
  `<id>/<type>.md`, never both.
- `src/core/portable.ts` — scope ids replace the nested availability shape.
- `src/commands/open.ts:255,306,324,342` — write paths.
- `src/commands/lint.ts` — path strings in findings; parent-id findings replaced
  by path-shape findings; the no-mixing rule becomes a path check; new findings
  for counterpart divergence (D11) and unresolvable asset `state:` (D14).
- `src/core/local-viewer-server.ts`, `BlrRefs.vue` — P1.
- `test/fixtures/fixture-shop/` — golden fixture layout.
- `blueprints/content-feed-reader/.businesslens/` — full relocation.
- `skills/businesslens-*/SKILL.md` and `agents/openai.yaml` — the folder contract
  they write.
- `spec/format.md` — **rewritten**, not patched. Folder layout (`:44-66`),
  universal conventions (`:68-109`), references (`:111-159`), `taxonomies.yaml`
  (`:223-236`), Interface / Experience / availability (`:263-400`), Domain
  (`:401-407`), Capability (`:454`), Screen (`:509-602`), both Scenario sections
  (`:665`, `:734`). Promote the cross-cutting shapes — references, availability
  scopes, assets — to top-level siblings instead of burying availability under
  Experience, where three other kinds already have to reach for it.
- `spec/report.md` — scope ids inside the report, the `schemaVersion` bump, and
  the portable projection's treatment of co-located assets. Smaller than the
  format change, which is why the two are separate files.
- `docs/` — Product Model group per D1 and D6; `docs/references.md` per D15;
  `docs/screens.md` per D10.
- `config.yaml` `schema: 4` → `5`.


---

# Part 6 — Operation path

Every step below is in **this repository**. Landing work is listed separately at
the end; it is downstream and blocks nothing here.

Each stage ends with `npm run verify` green. Stages 1–4 are independently
shippable and touch no format contract. Stage 5 is the breaking change.

## Gate 0 — resolve O1

Decide the id separator, `::` or `/`. Stage 5 encodes it in the loader, the
report, lint messages, and every fixture path, so changing it afterward is a
second migration. **Nothing else is blocked by this** — Stages 1–4 can proceed
in parallel with the decision.

## Stage 1 — Documentation corrections (no code)

| # | Change | Files |
| --- | --- | --- |
| 1.1 | Merge the two Scenario pages into `docs/scenarios.md` at order 16; renumber per the table in D1 | `docs/scenarios.md` (new), delete `docs/capability-scenarios.md` + `docs/journey-scenarios.md`, reorder `journeys.md` and everything from `business-rules.md` (18) down to `cli-contribute.md` (37) |
| 1.2 | Entity table and cross-links reflect one Scenario concept | `docs/product-model.md`, `docs/capabilities.md`, `docs/journeys.md`, `docs/screens.md`, `docs/business-rules.md` |
| 1.3 | System and legal views are not Screens (D10) | `docs/screens.md` |
| 1.4 | Which roles survive publication, on the role table itself (D15) | `docs/references.md` |

`scripts/check-repo.mjs` enforces order contiguity and uniqueness, so 1.1 fails
loudly if the renumber is wrong.

**Gate:** `npm run verify`.

## Stage 2 — Viewer and CLI (no format change)

| # | Change | Files |
| --- | --- | --- |
| 2.1 | Indent `capability-scenario` and `journey-scenario` as child rail items (D1) | `layers/nuxt/report-viewer/app/components/BlrWorkbench.vue`, `test/report-viewer.test.ts` |
| 2.2 | Second read-only mount rooted at the repository, extension-allowlisted to the existing MIME map, traversal guard kept (P1) | `src/core/local-viewer-server.ts`, `test/local-viewer-server.test.ts` |
| 2.3 | Local `kind: visual` targets render as thumbnails opening full size; other local kinds become links into that mount (P1) | `layers/nuxt/report-viewer/app/components/BlrRefs.vue` |
| 2.4 | An unexpected subdirectory becomes an explicit finding instead of silence (P3) | `src/core/model.ts:192`, `src/commands/lint.ts`, `test/lint.test.ts` |

2.2 and 2.3 are the gate on every asset decision being visible at all — without
them a model full of co-located images renders as dead grey text. Do them before
Stage 5, not after.

**Gate:** `npm run verify`, plus `businesslens view` against the golden
Blueprint to confirm a local image actually renders.

## Stage 3 — Domain as a subject axis (additive)

| # | Change | Files |
| --- | --- | --- |
| 3.1 | Redefine Domain as a region of subject matter; delete the umbrella advice; document `## Boundary` as expected (D6.1, D6.5) | `spec/format.md` |
| 3.2 | Same rule for authors | `docs/domains.md`, `docs/capabilities.md` |
| 3.3 | Derive Domains for Screen, Experience and Journey through their Capabilities; expose as a facet | `layers/nuxt/report-viewer/app/utils/reportWorkspace.ts`, `app/utils/entityFacets.ts`, `test/report-viewer.test.ts` |
| 3.4 | Add `## Boundary` to existing Domain files | `blueprints/content-feed-reader/.businesslens/domains/*`, `test/fixtures/fixture-shop/.businesslens/domains/*` |

**`## Boundary` stays optional in this stage.** Making it required is a lint
change that would fail every existing model, so it rides with Stage 5. 3.3 is
purely a viewer-side derivation and needs no report change — `reportWorkspace`
already back-fills relations the report only stores in one direction.

**Gate:** `npm run verify`.

## Stage 4 — Assets rendered, before the folder move

| # | Change | Files |
| --- | --- | --- |
| 4.1 | Reference `state:` on a Screen, validated against its `## Product states` H3 set (D14) | `spec/format.md`, `src/core/model.ts`, `src/commands/lint.ts`, `test/lint.test.ts` |
| 4.2 | Show a reference's `state` beside the state it depicts | `layers/nuxt/report-viewer/app/components/BlrRefs.vue`, `BlrInspectorDetail.vue` |

Optional and additive, so it lands without a schema bump and lets the landing
screenshot manifest retire early. Skip this stage if Stage 5 is close.

**Gate:** `npm run verify`.

## Stage 5 — Schema 5

One coordinated change. Order inside it is a dependency chain, not a preference:
the contract changes first (AGENTS.md rule), the loader second, everything that
reads the loader after.

### 5a. Contracts

1. **Rewrite `spec/format.md`** for the new shape. Promote references,
   availability scopes and assets to top-level sections rather than leaving
   availability buried under Experience. Carry the reasoning for D2 and D12
   inline — those two reverse things a reader would assume were deliberate.
2. **Update `spec/report.md`** — scope ids in place of nested availability,
   `schemaVersion` `8.0.0` → `9.0.0`, and what the portable projection does with
   co-located assets.

### 5b. Core

3. `src/core/model.ts` (665 lines) — walk the nested tree, load every entity from
   compact `<id>.md` or expanded `<id>/<type>.md`, derive ids from the logical
   path, resolve scope ids, derive
   counterparts from the path suffix, read assets from the folder.
4. `src/core/portable.ts` (1105 lines) — scope ids in the report, bump
   `REPORT_SCHEMA_VERSION`, keep `ProductReportSchema` a single-version alias
   with no compatibility reader.
5. `src/core/frontmatter.ts`, `src/core/markdown.ts` — drop `capability:`,
   `journey:`, `interfaces:`; accept `screens:`, `assets:`, `counterpartOf:`.

### 5c. Lint

6. `src/commands/lint.ts` (762 lines). Findings that change or arrive:
   - path-shape findings replace dangling-parent-id findings (D5)
   - an Interface may not hold both `screens/` and `experiences/` (D3)
   - `## Boundary` becomes required on Domain (D6.1)
   - a declared `domain:` must be in the derived set (D6.4)
   - `screens:` entries must resolve to children, be unique (D9)
   - counterparts diverging in `actors`/`access` warn (D11)
   - compact and expanded shapes coexisting, an empty expanded wrapper, or an
     expanded entity folder holding anything but `<type>.md`, a typed child
     directory, `implementation/`, or an allowlisted asset (D4, D8, D13)

### 5d. Write paths

7. `src/commands/open.ts` (431 lines) — expansion writes the nested tree.
8. `src/commands/export.ts`, `src/core/generated-files.ts`.

### 5e. Models

9. `test/fixtures/fixture-shop/.businesslens/` — 26 Markdown files relocated.
10. `blueprints/content-feed-reader/.businesslens/` — 67 Markdown files
    relocated, plus the availability rewrite in every one that declares it.

### 5f. Tests

11. `test/lint.test.ts` (808), `test/open.test.ts` (356),
    `test/report-sdk.test.ts` (466), `test/parsers.test.ts`, `test/e2e.test.ts`,
    `test/cli.test.ts`, `test/model-root.test.ts`, `test/inventory.test.ts`,
    `test/teaching-blueprint.test.ts`.

### 5g. Skills

12. Three `skills/businesslens-*/references/format.md` copies (176, 176, 184
    lines) — the condensed contract each skill carries.
13. Three `SKILL.md` files and three `skills/*/agents/openai.yaml` files — the
    folder contract they write.
14. `skills/businesslens-map/references/mapping-rubric.md` — what `map`
    produces from a real repository.

### 5h. Docs and release

15. Product Model entity pages for the new shapes: `interfaces.md`,
    `experiences.md`, `screens.md`, `domains.md`, `product.md`, `scenarios.md`.
16. `config.yaml` `schema: 4` → `5` in `src/core/model.ts` and
    `src/commands/open.ts`.
17. `CHANGELOG.md` `[Unreleased]`; `.claude-plugin/plugin.json` and
    `package.json` versions in sync.

**Gate:** `npm run verify`; `npm pack --dry-run`; `claude plugin validate . --strict`;
skill-creator `quick_validate.py` on all three skills.

## Stage 6 — Co-located assets (additive within schema 5)

Separable from Stage 5 because it only adds files to folders that already exist.
No second schema bump.

| # | Change | Files |
| --- | --- | --- |
| 6.1 | `implementation/` as the reserved subdirectory; asset hardening rules reused from `logo.svg` (D8, D13) | `spec/format.md`, `src/core/model.ts`, `src/commands/lint.ts` |
| 6.2 | Optional `assets:` metadata list, unlisted files legal (D14) | `src/core/frontmatter.ts`, `src/commands/lint.ts`, `test/lint.test.ts` |
| 6.3 | `--force` backup excludes `implementation/`; default `.gitignore` does **not** | `src/commands/open.ts`, `spec/format.md` |
| 6.4 | Co-located assets render in the Workbench | `BlrRefs.vue`, `BlrInspectorDetail.vue` |
| 6.5 | Keep `product.md` compact without a logo; expand to `product/product.md` with `logo.svg` beside it | `src/core/model.ts`, `src/logo.ts`, both models |

**Gate:** `npm run verify` plus a `businesslens view` pass showing a co-located
mockup and an `implementation/` capture rendering distinctly.

## Not an action

**D16** (a section is visualizable only when four things align) is a rule for
future changes, not a task. Any newly formalized entity section must land all
four rows — recognized H2, required content shape, typed report field, component
— or stay in `supportingSections`.

## Downstream, other repository

`businesslens/landing`: L1 is fixed by Stage 1.1. L2–L4 (entity grid, vocabulary,
build check) and L5–L6 (artwork derivation, media type) are independent of every
stage here. L6 must ship with Stage 5 — landing pins `version=7` while binding
the V8 schema, and Stage 5 makes that a third mismatch.

## Summary

| Stage | Breaking | Ships alone | Gate |
| --- | --- | --- | --- |
| 1 Docs | no | yes | `verify` |
| 2 Viewer + CLI | no | yes | `verify` + manual `view` |
| 3 Domain axis | no | yes | `verify` |
| 4 Reference `state:` | no | yes | `verify` |
| 5 Schema 5 | **yes** | no — one change | `verify`, `pack`, plugin + skill validation |
| 6 Assets | no | yes, after 5 | `verify` + manual `view` |
