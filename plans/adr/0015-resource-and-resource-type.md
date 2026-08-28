# 0015 — A resource, and its resource type

Status: **Accepted** — 2026-08-28

Supersedes [0012](./0012-entity-and-element.md) in part. `Entity` stands;
`Element` does not.

## Context

[ADR-0012](./0012-entity-and-element.md) took `Entity` for the kind that names a
thing the Product keeps, and gave `Element` to the kind of file a Product Model
holds. `Entity` was right and is not reopened. `Element` was asserted in that
ADR's Decision with no considered-and-rejected section — the only unexamined
choice in the series — and four costs surfaced once it landed.

**It says nothing.** The sentence the project needs is *"the Product Model has N
___"*, and `element` means "a part of something", which is true of every noun in
the format. The word carries no claim a reader can be wrong about.

**It collides where the code is densest.** The Product Report viewer is Vue.
`resolveElement`, `elementNode`, and `visibleElements` sit beside
`documentElement` (44), `createElement*` (130+), `scrollElement` (54), and
`parentElement` (24). No reader can tell which `element` a line means.

**It cannot also be an example.** `spec/format.md` reached for a self-relation
example and wrote *"an Element relates to other Elements, a Task blocks another
Task"* — authored fresh, after the rename, inside the document that reserves the
word. A reserved meta-term cannot double as a product noun.

**It named two levels at once**, which is the defect it inherited from `entity`
rather than repaired. `docs/product-model.md` headed a table of the types
`| Element |` while `spec/format.md` said an element is one compact file. The
code had already split them — `ReportElementKind` for the type, `AnyElementView`
for the instance — and the prose never followed.

## Decision

**One authored file is a `Resource`. Its type is a `resource type`.**

> The Product Model has twelve resource types.
>
> A resource without assets or children is the compact file `<id>.md`.

The base word is shared and the type level is marked by a modifier. That is the
repair: `entity` and then `element` named both levels with nothing to tell them
apart, so a reader could not know which was meant without already knowing.

The vocabulary is defined in `spec/format.md`'s Terms table and nowhere else.
`docs/` does not redefine it, for the same reason no entity is explained twice.

**Three candidates were considered and are unavailable:**

- **`Kind`** — `kind:` is already an authored field carrying five closed enums,
  on References, Actors, Scenario Steps, Business Rules, and Scenarios; 327
  occurrences across this model and the fixture. Unlike Kubernetes, a
  BusinessLens file never states its own type as a field — the path states it.
  `kind` therefore remains a **code** word, as `ReportResourceKind`, and is never
  prose for the type level.
- **`Object`** — 28 `Object.*` calls in `src/` and the viewer, and it shipped in
  0.9.0 as the name of the kind now called `Entity`. Reusing it one release later
  for a different meaning is precisely what this series exists to prevent.
- **`Component`** — already the contract's word for the implementation unit a
  model must refuse to mirror: *"An implementation component is not an Actor
  merely because it calls another component"* (`spec/format.md:480`), four
  rubrics instructing the agent to ignore components, and a home-page card
  reading *"A meaningful view, not a route or a component."*

`Building block` was the strongest word tested at the type level and cannot reach
the instance level: it yields no identifier, and nobody says a model holds
forty-seven building blocks.

## Consequences

- **This is a correction, not a migration.** npm is at 0.8.0; `Element` exists
  only on the unreleased 0.9.0 branch. Users move `entity` → `resource` in one
  step, in the same release that introduces `Entity` and schema 7. No aliases and
  no deprecation window, because nothing was ever released to deprecate.
- **The wire contract does not move.** `element` is not a key in
  `src/core/portable.ts`; the report carries separate collections and separate
  counts. No folder-schema bump and no Product Report version bump.
- Borrowed from Kubernetes: one word per level, and the level marked rather than
  inferred. Deviated from it knowingly — Kubernetes puts `resource` on the
  collection and `object` on the instance. Here the collection is the folder,
  which names itself, and `object` was unavailable.
- `Resource` and `Reference` now sit adjacent in the format. They are
  structurally distinct and never occupy the same grammatical position; the
  mitigation is prose discipline — *"a Reference on a Resource"*, never *"a
  resource reference"*.
- **A resource type is documented on its parent's page when its type name names
  that parent.** This replaces the claim that Scenarios are the only type with a
  mandatory single parent, which was untrue: an Experience always sits inside
  exactly one Interface. Under the corrected rule Scenarios still resolve to
  their parents' pages, and Experience and Screen keep their own.
