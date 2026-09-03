# Product Model format

## Layout

A representative model looks like this:

```text
.businesslens/
├── README.md
├── config.yaml
├── taxonomies.yaml
├── coverage.md
├── .gitignore
├── product.md                    # or product/product.md beside logo.svg
├── interfaces/<id>/
│   ├── interface.md
│   ├── screens/<id>.md                       # when no Experience divides it
│   └── experiences/<id>/
│       ├── experience.md
│       └── screens/<id>.md
├── domains/<id>.md                          # optional collection
├── entities/<id>.md                         # the things, including those that act
├── capabilities/<id>/
│   ├── capability.md
│   └── scenarios/<id>.md
├── journeys/<id>/                           # optional collection
│   ├── journey.md
│   └── scenarios/<id>.md
└── business-rules/<id>.md                   # optional collection
```

Use `<id>.md` while a resource has no assets or child resources. When it gains the
first one, move it to `<id>/<type>.md` and keep owned assets beside that file.
Put generated implementation captures under `implementation/`. The compact and
expanded forms never coexist and derive the same id. Optional `assets:`
frontmatter annotates existing files with `title` and, on Screens only, a
View-state `state`; it never creates or classifies an asset.

Use these exact compact and expanded paths:

| Resource type | Compact | Expanded | Typed children |
| --- | --- | --- | --- |
| Product | `product.md` | `product/product.md` beside `logo.svg` | — |
| Interface | `interfaces/<id>.md` | `interfaces/<id>/interface.md` | `screens/`, `experiences/`, or both |
| Experience | `interfaces/<interface-id>/experiences/<id>.md` | `interfaces/<interface-id>/experiences/<id>/experience.md` | `screens/` |
| Screen | `<screen-parent>/screens/<id>.md` | `<screen-parent>/screens/<id>/screen.md` | — |
| Domain | `domains/<id>.md` | `domains/<id>/domain.md` | — |
| Entity | `entities/<id>.md` | `entities/<id>/entity.md` | — |
| Capability | `capabilities/<id>.md` | `capabilities/<id>/capability.md` | `scenarios/` |
| Capability Scenario | `capabilities/<capability-id>/scenarios/<id>.md` | `capabilities/<capability-id>/scenarios/<id>/capability-scenario.md` | — |
| Journey | `journeys/<id>.md` | `journeys/<id>/journey.md` | `scenarios/` |
| Journey Scenario | `journeys/<journey-id>/scenarios/<id>.md` | `journeys/<journey-id>/scenarios/<id>/journey-scenario.md` | — |
| Business Rule | `business-rules/<id>.md` | `business-rules/<id>/business-rule.md` | — |

Here `<screen-parent>` is the Interface or Experience folder that contains the
Screen. There is no `actors/` collection: **an Actor is an Entity that `acts`**,
and the word names the role such an Entity plays on a Step, an Interface, an
Experience, a Journey, or a Business Rule grant.

IDs are lowercase kebab-case segments. Behavior-hierarchy and cross-cutting ids
are the bare file or folder name. Qualified ids for Interfaces, Experiences,
and Screens carry their path joined by `::` —
`reader-web::personal-library::unread-library` — because Experience and Screen
names repeat across Interfaces on purpose. Two resources of the same kind sharing
a path suffix below their Interface are counterparts: the same thing on two
Interfaces.

The path owns every parent relation. An Experience never writes `interfaces:`,
a Capability Scenario never writes `capability:`, a Journey Scenario never
writes `journey:`, and a Screen never writes `availability:`. Capability
Scenario and Journey Scenario IDs share one global namespace. Only
`product.md` declares `id:`. The
first and only H1 is the title. Most resources use lead prose as their description;
Journeys and both Scenario types instead use required named sections and must
not contain lead prose. Put relations and navigation in frontmatter and Product
meaning in prose. Product tags and every relation ID list contain unique
values. Each recognized H2 appears at most once; unrecognized H2 sections are
preserved as structured supporting content. Lead and section-body fragments do
not contain another H1 or H2.

## Required shapes

- `config.yaml`: exactly `schema: 8` and `sdd.paths`.
- `product.md`: `id`, optional `summary`, `category`, `tags`, `authors`,
  `license`, `limitations`, H1, lead description, and optional `## Intent`.
  `summary` is one line of at most 400 characters, `category` is lowercase
  kebab-case, `authors` are `{ name, url? }` records, and `license` is an SPDX
  identifier. Report hosts read those four as portable Product identity and
  attribution, so a model intended for a Blueprint authors them.
- `taxonomies.yaml`: `scenarioKinds` entries with `id`, `name`, `description`,
  and optional `colorSlot`.
- Interface: required `type`
  (`web|mobile-app|desktop-app|cli|api|webhook|messaging|voice|device|agent`),
  at least one `actors` entry naming an Entity that `acts` — **who uses** the
  Interface, a descriptive list, never a permission claim; optional
  Product-facing `entryPoints`, each keyed by this Interface's own type or by
  another Interface's id when a reader arrives from that surface; H1, lead
  description, and `## Capability boundary`. Interfaces are inbound. An
  outbound connection the Product opens is not an Interface: model it in the
  calling Capability, give that Capability an availability Context for where
  the Actor observes the result, and make its failure a Capability Scenario.
- Experience: at least one `actors` entry, each an Entity that `acts` and
  supported by the owning Interface; `access`
  (`public|authenticated|restricted`); optional Interface-keyed `entryPoints`;
  H1, lead description, and `## Capability boundary`. The collection is
  optional. For every Interface using Experiences, their Actor union covers all
  Interface Actors.
- Capability: at least one `availability` Context; optional singular `domain`;
  H1 and lead description. **It declares nothing about Entities** — what it
  changes is what its Scenarios' Steps say, and a file still carrying
  `entities` is refused. Every Capability needs a Capability Scenario for every
  availability Context: a gap is an error at complete coverage and a warning
  at draft or partial coverage.
- Capability Scenario: taxonomy `kind`, named `routes`, and ordered typed
  `steps`. Its parent Capability is implicit on every Step.
- Domain: H1, lead description, and `## Boundary`; optional `colorSlot`. A Domain
  is a region of subject matter, classifying members of the Interface →
  Experience → Screen and behavior hierarchies. Only
  Capability authors `domain:`; every other Domain relation is derived. Its
  `## Boundary` must state something the Domain does **not** own, and a Domain
  naming fewer than two Capabilities is a warning.
- Naming: a behavioral id's noun half names something the model declares —
  `install-agent-skills`, not `install-skills`, when `agent-skills` is an
  Interface. Entity, Domain and Business Rule ids never open with a verb; they
  name what a thing is or what must remain true.
- Entity: H1, lead description, and at least one of `## Information kept`,
  `## States`, and `acts`. `## Information kept` is a bullet list of **named**
  single-line facts, each `- **Name** — prose` with an em dash as the only
  separator, names unique within the Entity; a Business Rule cites a fact by
  that exact name, and nothing else does. `## States` is H3 names with prose;
  the first listed state is the one a thing starts in. **The Entity declares
  its states and nothing about the moves between them**: the lifecycle is
  composed from Scenario Steps, there is no `transitions` key, and a file still
  carrying one is refused. `## Relations` and `## Transitions` are invalid
  sections, and `state` is never valid on an Entity's assets or References.
  Optional `domain`. Optional `relations`, each `{ entity, verb, cardinality }`
  where cardinality states both ends source to target — `one-to-one`,
  `one-to-many`, `many-to-many`; `many-to-one` is refused and declared from
  the other Entity instead. Declared on one side only — the inverse is derived,
  and two Entities relating back at each other is a warning. A relation may
  target an Entity that acts: ownership is a relation, `owns`, declared on the
  owner. **An Entity that acts** carries `acts: external|internal`, relative to
  the Product boundary, and with it `kind: person|system`, required exactly
  when `acts` is set. It acts when it initiates, with a goal or privilege of
  its own, under an inbound contract the Product must keep stable — a Reader,
  a store admin, a payment gateway that posts webhooks, the AI agent harness
  (`ai-agent`, `kind: system`, `acts: external`). A system the Product calls
  out to does not act; a privilege that exists only in code is authorization,
  not product meaning, and is never modelled. An Entity is a thing an Actor
  points at and the Product tells apart — identity, not storage. Never a data
  model: no types, no keys, no foreign keys. Also never a representation of
  another Entity (a serialization or export is that thing in another shape), a
  receipt the Product keeps to work safely (ask who the record is for), or the
  Product's own surfaces, shipped content and closed vocabularies — where there
  are no instances, only members of a fixed list, that is a vocabulary. For a
  family of candidates sharing a word, write `## Information kept` before
  deciding how many Entities there are: one if a single list is true of all of
  them, several the moment it needs "depending on the kind". Where one list is
  a subset of another the intersection proves nothing: ask whether the smaller
  one has an address of its own — a file, a route, a scope a command accepts.
  Containment is storage and storage is never the test, and the
  closed-vocabulary exclusion reads against the thing you would name, not the
  classification above it. Stored and rendered alike is not the test. When
  close, split — a merge stays available, a collapse leaves nothing saying the
  question existed. It must be changed by a Step, presented by a Screen, named
  as an actor somewhere, or read by a Business Rule as a condition's `entity`
  or a `configuredBy`; a Step's read never counts, and neither does a relation
  from another Entity.
- Screen: at least one `capabilities` relation, optional `entities` naming what
  it presents (authored, because a Screen has no acceptance surface), no
  `availability` — its path is its place; optional Interface-keyed Product
  entry points; H1, lead, bullet `## Information presented` (prose about the
  view, never a fact cited by name), optional bullet `## Available actions`,
  optional H3 `## View states`, and `## Capability boundary`. Each information
  or action item occupies one physical line. The whole collection is optional.
- Business Rule: a durable constraint, derivation, or permission — H1 and lead
  assertion, optional `## Intent` and `## Rationale`, and a non-empty
  `appliesTo` list of typed `capability`, `capability-scenario`, `journey`,
  `journey-scenario`, direct `context`, or `entity` targets. An Entity target
  is `{ type: entity, id, effect?, from?, to?, facts?, contexts? }`: **a target
  selects; a grant conditions.** `effect`, `from` and `to` select Steps by the
  keys their `entities` entry carries (`from` with `changes|removes`, `to` with
  `creates|changes`, neither with `reads`); `facts` names the facts it governs;
  `contexts` names a Screen presenting the Entity or an ancestor. A `from` that
  every selected Step already leaves from is a warning — the minimal selector
  is canonical. Optional `permits`: omitted means no authorization claim, `[]`
  means forbidden to everyone, a list means permitted through any one grant.
  Grants are OR, keys within a grant are AND, Rules selecting the same
  operation are AND, and an operation no permission Rule selects is open. A
  Rule with `permits` targets Entities only. Every grant names a who — one of
  `actors` (Entities that act), `related` (a path of `{ verb, entity }`
  segments from the targeted Entity, walking relations and their inverses,
  ending on an Entity that acts), `self: true` (the instance itself),
  `unattended: true` (the Product's own schedule), `configuredBy` (an Entity
  holding customer configuration) — plus optional `when`, a list of AND-ed
  conditions, each `{ fact, <operator>: value }` with one of
  `over|under|at-least|at-most|is|is-not|present|absent`, optionally
  `entity` to read another Entity's fact, or `{ state: X }` for the instance's
  current state (valid on every target but `creates`, needed because reads and
  information changes carry no state to select by). A value is a scalar or
  `{ configuredBy: <entity-id> }`. Permission claims appear only here. A Rule
  on exactly one behavioral target with no `contexts` is a warning; Entity and
  Context targets are always valid.
- Journey: at least one unique `actors` entry, H1, no lead prose, `## Goal`,
  and `## Success criterion`. A Journey is a stable goal, not a route or
  Capability wrapper. Every Journey needs achieved Journey Scenario coverage
  for every Journey Actor. It has no `entryPoints`; resolve presentation routes
  from the first Actor-owned placed Step's Context place and its Interface or
  Experience.
- Journey Scenario: taxonomy `kind`, `result: achieved|not-achieved`, named
  `routes`, and ordered non-empty typed `steps`. A Step may name a Capability,
  and must when its `entities` carries a `creates`, `changes` or `removes`
  effect. An achieved Scenario traverses at least two distinct Capabilities.
- `coverage.md`: `status`, `method`, `sourceAreas`, `unmapped`, `limitations`,
  H1, and lead rationale with no H2 sections. Status is model breadth only:
  `draft|partial|complete`. A complete model has at least one Capability.

Both Scenario types have no lead prose, author `routes` and `steps` in
frontmatter, require `## Trigger` and `## Outcome`, and forbid Markdown
`## Steps`. Each structured Step needs single-line `text`,
`kind: actor|product|condition`, and `entities`. An `actor` Step requires
`actor`, an Entity that acts, who performs it; a `product` or `condition` Step
may carry `actor`, meaning the Actor the Step is attributable to — the Product
did it for them. Every actor named joins the Scenario's Actor set. A Scenario
with no actor Step needs an unattended trigger: a first `condition` Step with
`unattended: true`, and then no Step carries `actor`. **`entities` is required
on every Step** and `[]` when it touches nothing; silence is impossible. Each
entry is `{ entity, as?, effect, from?, to? }`: `effect` is
`creates|changes|removes|reads`, defaulting to `changes`; `creates` takes
`to`, `removes` takes `from`, `changes` takes both or neither (neither is an
information change — a rename), `reads` takes none; every state named is one
the Entity declares, and there is no wildcard `from`. One observable act can
move several things, so a Step lists as many as it changes, one entry per
`(entity, as)` pair. `as` is a scenario-local instance alias for two instances
of one Entity in one Scenario; once aliased anywhere in the Scenario, aliased
everywhere. Where an earlier Step left an `(entity, as)` pair in a state, a
later Step's `from` for it must match. `reads` is a bare mention: no state,
never a change, never enough to keep an Entity from being an orphan. Author
the effects on the Step that performs them. After drafting, re-read every
Step's `text` against the Entity list and complete its `entities`: a Step
whose text names an Entity title it does not declare is a finding, graded by
coverage status, exempting the Step's own `actor` and the phrase "The
Product". A Step performing an operation a Business Rule governs must have an
actor with a possible grant, and a Step performing one a Rule closes with
`permits: []` is an error. Optional `## Edge cases` is a non-empty single-line
bullet list. Journey-only Goal and Success criterion sections are invalid on
Scenarios, Scenario-only sections are invalid on Journeys, and every recognized
H2 appears at most once. Optional `## Decision points` uses an H3 title, a
question, and at least two `condition → outcome` branches that converge on the
Scenario's one result. A branch that changes the Capability sequence or
terminal result is a separate Scenario. `kind` describes the nature of the
variation; `result` describes the terminal Journey goal outcome, so the fields
are orthogonal.

A Capability Scenario in full. One route still declares `routes`; Steps carry
`text`, `kind` and `entities`, an `actor` Step names its Actor, and each Step
maps every declared route id to one Context place:

```markdown
---
kind: primary
routes:
  web: Web
steps:
  - text: The Reader provides a collection name
    kind: actor
    actor: reader
    entities: []
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The Product creates a private collection owned by that Reader
    kind: product
    actor: reader
    entities:
      - { entity: collection, effect: creates, to: Private }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The empty collection is ready to edit
    kind: condition
    entities:
      - { entity: collection, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
---

# Create an owned collection

## Trigger

The Reader chooses to organize saved items in a new collection.

## Outcome

The Reader has a new private owned collection with the chosen name.
```

`kind` names an id declared in `taxonomies.yaml`. The containing
`capabilities/<capability-id>/scenarios/` directory is the only parent
authority, so no `capability:` field is written. A Journey Scenario has the same
shape plus a required `result`.

An Entity that acts, in full. `kind` is required exactly because `acts` is
set; the relation is declared here, on the owner, and its inverse is derived on
Order:

```markdown
---
kind: person
acts: external
relations:
  - entity: order
    verb: owns
    cardinality: one-to-many
---

# Shopper

A person who browses the catalog and buys products.

## Information kept

- **Delivery address** — where their orders are sent
```

A Business Rule with an Entity target and grants, in full. The target selects
every Step carrying `{ entity: order, effect: changes, to: Refunded }`; the
grants say who may perform it, and `when` conditions the grant it sits in:

```markdown
---
appliesTo:
  - type: entity
    id: order
    effect: changes
    to: Refunded
permits:
  - related: [{ verb: owns, entity: shopper }]
    when:
      - { fact: Total charged, under: 100 }
  - actors: [store-admin]
---

# Refunds above the threshold need an operator

A shopper refunds their own order while its total is under 100; a store admin
refunds any order.
```

`related` walks the Shopper's `owns` relation back from Order to an Entity that
acts. `self: true` would say the instance itself may, and requires the targeted
Entity to act — an Order does not, so `self` here is an error. A `when`
condition names a `fact` with exactly one operator, optionally on another
Entity through `entity`, or `{ state: X }` for the instance's current state; a
`state` condition cannot be combined with `entity` and is invalid on a `creates`
target. `permits: []` says nobody may. The lifecycle the Rule governs is
composed from Steps, not declared on Order: a Step's
`{ entity: order, effect: changes, from: Confirmed, to: Refunded }` is what
puts Refunded on the machine. `lint` composes every Scenario and warns on an
**unreached state** — a state other than the first that no Step leaves anything
in — and an **unproduced origin** — a Step leaving `from: Confirmed` when
nothing produces Confirmed and it is not the first state.

Context is the single model concept for where behavior applies. In schema 8 it
is a strict object containing one `place` field. A Capability's availability
Contexts name an undivided Interface or an Experience:

```yaml
availability: [{ place: reader-web::personal-library }, { place: reader-mobile::personal-library }, { place: operator-cli }]
```

An Experience belongs to exactly one Interface, so its id already names it. A
Context place either names a declared Interface, Experience, or Screen or it
does not. An Interface holds `screens/`, `experiences/`, or both. A Screen
beside `experiences/` is shared: it is inside every Experience of that
Interface, so every Capability it exposes must be available in each of them,
and a Step on it (`interface-id::screen-id`) counts as coverage for each. A
view whose Capabilities differ by Experience is two Screens, one under each.
Availability is intended Product meaning, not implementation status.

Business Rule Contexts use the same object shape:

```yaml
context: { place: reader-web::personal-library }
```

Use a bare Interface id for an undivided Interface and
`interface-id::experience-id` for an Experience; there is no separate
`experience` field. A resource Rule target may omit `contexts` to cover all
target contexts or provide a non-empty list to narrow it. Targets are additive.
A Capability plus one of its Capability Scenarios, or a Journey plus one of its
Journey Scenarios, is redundant and invalid. Domains are derived Rule
backlinks, not authored targets.

Each Scenario route maps a stable kebab-case id to a human name. A placed Step
maps every route id to its most-specific Context; a Step without `contexts` is
shared by all routes and has no Context. When its parent owns Screens, the
Context place must name a Screen; otherwise it names the leaf Experience or
Interface. Every route is placed at least once and no two routes repeat one
place sequence. A place change between
consecutive placed Steps is a Context place transition.

Scenario Actors, Entities, availability places, Screen participation, and
backlinks derive from Steps. Every Actor must be supported by at least one
selected Context place and every derived availability place must support a
Scenario Actor. A Capability-bearing Context place must be inside that
Capability's availability, and a Screen place must expose it. Every Journey
route begins its Actor-owned
placed Steps with a Journey Actor. Screens never author Scenario ids.

Every semantic resource may contain optional `references`. Each strict item needs
`kind: code|prd|spec|proposal|doc|adr|visual|research`,
`role: intent|implementation|context`, `target`, and optional `title`. Code
targets use `path[#symbol][:start[-end]]` and their path must be tracked. Other
targets use HTTP(S) or a repository-relative path. Duplicate targets on one
resource are invalid. References are attachments, never proof or lifecycle state.
Coverage, config, and taxonomies do not accept them.

`.gitignore` contains `build/` and `cache/`.

## Canonical `.businesslens/README.md`

Write this orientation for every new Product Model:

```markdown
# Product Model

This directory is a **BusinessLens Product Model**: what this product does and
for whom. It is plain Markdown tracked in Git, and it is the source of truth for
intended product behavior.

## If you are an agent working in this repository

- Read `product.md` or `product/product.md` first, then the Entities — the
  things the product keeps, including the people and systems that act on it —
  and the Interfaces, optional Experiences, Screens, and Domains, followed by
  Capabilities, Business Rules, Journeys, and both Scenario collections.
- Expect leaf resources as `<id>.md`; `<id>/<type>.md` means that resource owns
  child resources or assets.
- Treat Capability Scenarios as local acceptance contracts, Journey Scenarios
  as end-to-end Steps contracts, and Business Rules as what must remain true,
  including who may act.
- Do not infer a stack or architecture from the model.
- References are optional navigation and context. Their role explains why an
  artifact is attached; it never proves alignment or replaces product prose.
- After code changes, use `businesslens-verify`; run `npx businesslens lint`
  for structural checks.
- Use `businesslens-ideate` to change intended behavior and `businesslens-map`
  only to map established absent or deliberately untrusted behavior.
- Never edit `cache/`.

Documentation: https://businesslens.io
```
