# Renaming the meta-term to Resource

The decision and its argument are [ADR-0015](./adr/0015-resource-and-resource-type.md).
This file is the change inventory: what moves, in what order, and what must not
move. Not started at time of writing.

## The vocabulary

| Level | Concretely | Word |
| --- | --- | --- |
| The type — twelve of them | `Capability`, `Actor`, `Entity` … | **resource type** |
| One authored file | `capabilities/lint-product-model/capability.md` | **resource** |
| The collection | `capabilities/` | *nothing — the folder names itself* |
| The type in code | `'capability'` as a discriminator | **`kind`**, code only, never prose |

`Entity`, `Context`, `Place`, `Route`, `Step`, `Reference`, and every `kind:`
enum are untouched.

## What does not change

- **No wire-format change.** `element` is not a key in `src/core/portable.ts`;
  the report carries separate collections and separate counts. No folder-schema
  bump, no Product Report version bump, no catalog renegotiation.
- **No migration path.** npm is at 0.8.0 and `Element` exists only on the
  unreleased 0.9.0 branch, so no user has seen the word. The 0.9.0 CHANGELOG
  entry is *edited*, not appended to. No aliases, no deprecation.

## Site inventory

Counts are current-word occurrences, DOM uses filtered out.

| Surface | `element` | stale `entity` | Notes |
| --- | --- | --- | --- |
| `spec/format.md` | 38 | — | Terms table gains Resource / resource type |
| `spec/report.md` | 12 | — | prose only; state that no wire field moves |
| `docs/` | 48 | — | table headers at `product-model.md:46` and `:213` |
| `skills/` | 47 | — | ships to users; 500-line cap per `SKILL.md` |
| `README.md` | 0 | **6** | never swept in the first rename |
| `AGENTS.md` | 0 | **9** | includes the parent rule to correct |
| `plans/glossary.md` | 0 | **5** | never swept; also omits `Entity` entirely |
| `CHANGELOG.md` | 9 | 73 | most `entity` uses are the kind and stay |
| `src/` | 75 | — | incl. `EntityElement` → `EntityResource` |
| `layers/nuxt/report-viewer/` | 597 raw | — | ~150 real identifiers; rest is DOM |
| `viewer/app/app/` | 7 | — | |
| `test/` | 72 | — | |
| `.businesslens/` | 55 | — | incl. two Screen **ids** |
| `plans/` | 26 | — | |

### Code identifiers

`ElementFile`, `ElementBase`, `ElementContentSchema`, `ElementReference`,
`ElementAsset`, `ElementGroup`, `ElementCardMetric`, `AnyElementView` (107),
`elementKey` (98), `ReportElementKind` (98), `resolveElement` (44), `elementId`,
`openElementPage`, `elementsOfKind`, `docsForElementKind`, `elementCards`,
`elementFacts`, `elementFacets`, `elementBadge`, `focusElementIds`,
`allElements`, `elementCollections`, `listElements`, `readElement`,
`elementContent`, `elementPath`, `elementsById`.

### File renames

`BlrElementBody.vue`, `BlrElementCard.vue`, `BlrElementPage.vue`,
`elementCards.ts`, `elementDocs.ts`, `elementFacets.ts`, `elementFacts.ts`.

### Model ids

`.businesslens/interfaces/local-report-web/screens/element-collection.md` and
`element-page.md` → `resource-collection` / `resource-page`. These are ids: they
are referenced by Scenario Steps and `coverage.md`, and they appear in any
exported Blueprint. `lint` catches dangling references, so the rename is safe but
it is model content, not vocabulary.

## Defects fixed in the same pass

1. **`spec/format.md:779`** — *"an Element relates to other Elements, a Task
   blocks another Task"*. A straight swap reproduces the bug as *"a Resource
   relates to other Resources"*. Needs a genuine product noun.
2. **`spec/format.md:61`** — the `Entity` row is appended below Business Rule
   instead of sitting after Domain, where `docs/product-model.md` puts it. The
   two contracts disagree on the model's own ordering.
3. **`AGENTS.md`** — *"Scenarios are the only such entity"* is untrue; an
   Experience also has a mandatory single parent. Replace with: *a resource type
   is documented on its parent's page when its type name names that parent.*
4. **`plans/glossary.md`** — never swept, and its model-kinds table omits
   `Entity`, the kind the whole exercise existed to make room for.
5. **`.businesslens/entities/*.md`** — thirteen files restate `spec/format.md`
   almost verbatim, a fourth register `AGENTS.md` forbids. Rewrite each lead
   paragraph as a *gloss* in user language; if a sentence paraphrases the spec,
   one of the two is redundant and it is not the spec.
6. **`.businesslens/entities/product-model.md`** — twelve aggregated `holds`
   relations encode format containment where `lint` cannot check it, and encode
   it wrongly (it claims the Product Model holds Experiences and Screens; the
   format says an Interface does). Move each edge to the entity that owns it and
   keep only the lifecycle. 134 lines → roughly 45.

## Hazards

- **Nuxt component shadowing.** Components auto-import by filename and
  `report-viewer-lab` overrides them *by name* — `viewer/app/nuxt.config.ts`
  documents this for `BlrEntityPeek` / `BlrEntityPage`. A lab override not
  renamed in the same commit stops shadowing **silently**, with no error. Rename
  both layers together and assert it in `report-viewer-lab.test.ts`.
- **`identity` must survive.** ADR-0012 recorded that a naive substitution turns
  `identity` into `idelement`; the same trap applies here. `ReportIdentity` and
  `isIdentity` are real names.
- **Skill line budget.** "resource type" is longer than "element" at every
  type-level site and each `SKILL.md` is capped at 500 lines.

## Order

1. ADR-0015 and this plan. **Done.**
2. `spec/format.md` and `spec/report.md`, with defects 1 and 2.
3. `src/` and `layers/`, `viewer/`, file renames and lab shadowing in one commit.
4. `test/`, then `npm run verify`.
5. `docs/`, `skills/`, `README.md`, `AGENTS.md` with defect 3.
6. `.businesslens/` — ids, then the gloss rewrite (defect 5) and
   `product-model.md` (defect 6).
7. `plans/glossary.md` (defect 4) and the 0.9.0 CHANGELOG entry.
8. Landing repo — see below.

## Landing repository

Worktree: `~/.superset/worktrees/5846c315-.../holy-penguin`. The unrelated
hero/SEO rewrite and ERD FAQ stay on the branch.

- `faqContent.ts` — the three strings changed last week change again; plus the
  ERD comparison table, which contrasts an ERD's "Entities" with the Product
  Model without noting that the model's own word for those is `Entity`.
- `homeContent.ts` — ~15 comment sites, **plus the ninth card**: Entity, placed
  after Domains as `docs/product-model.md` orders it. `columns: 4` becomes 3, so
  nine cards read as three rows of three — which `HomeLayout.vue:8` has claimed
  since before there were nine.
- **The ninth card ships without an emblem.** `public/brand/icons/entities/`
  holds nine copperplate plates and none is an Entity. `emblem?` is optional and
  `HomeCard.vue` guards on it. The plate and the `/docs/entities` link backfill
  together.
- `public/brand/icons/entities/` → `public/brand/icons/resource-types/`; nine
  files, referenced only as `img src` from `homeContent.ts`.
- `CONTEXT.md`; ADR filenames `0009-the-home-page-teaches-all-eight-entities.md`
  and `0012-public-terminology-lives-with-entities.md`, and their bodies.
- `docs/design/*` — "the nine entities"; `content/blog/pdd-and-spec-driven-development.md:89,108`.
- `tests/e2e/landing.desktop.spec.ts:511` asserts a FAQ label verbatim.
