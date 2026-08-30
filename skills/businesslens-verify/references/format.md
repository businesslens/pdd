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
├── actors/<id>.md
├── interfaces/<id>/
│   ├── interface.md
│   ├── screens/<id>.md                       # when no Experience divides it
│   └── experiences/<id>/
│       ├── experience.md
│       └── screens/<id>.md
├── domains/<id>.md                          # optional collection
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
Product-state `state`; it never creates or classifies an asset.

Use these exact compact and expanded paths:

| Resource type | Compact | Expanded | Typed children |
| --- | --- | --- | --- |
| Product | `product.md` | `product/product.md` beside `logo.svg` | — |
| Actor | `actors/<id>.md` | `actors/<id>/actor.md` | — |
| Interface | `interfaces/<id>.md` | `interfaces/<id>/interface.md` | `screens/`, `experiences/`, or both |
| Experience | `interfaces/<interface-id>/experiences/<id>.md` | `interfaces/<interface-id>/experiences/<id>/experience.md` | `screens/` |
| Screen | `<screen-parent>/screens/<id>.md` | `<screen-parent>/screens/<id>/screen.md` | — |
| Domain | `domains/<id>.md` | `domains/<id>/domain.md` | — |
| Capability | `capabilities/<id>.md` | `capabilities/<id>/capability.md` | `scenarios/` |
| Capability Scenario | `capabilities/<capability-id>/scenarios/<id>.md` | `capabilities/<capability-id>/scenarios/<id>/capability-scenario.md` | — |
| Journey | `journeys/<id>.md` | `journeys/<id>/journey.md` | `scenarios/` |
| Journey Scenario | `journeys/<journey-id>/scenarios/<id>.md` | `journeys/<journey-id>/scenarios/<id>/journey-scenario.md` | — |
| Business Rule | `business-rules/<id>.md` | `business-rules/<id>/business-rule.md` | — |
| Entity | `entities/<id>.md` | `entities/<id>/entity.md` | — |

Here `<screen-parent>` is the Interface or Experience folder that contains the
Screen.

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

- `config.yaml`: exactly `schema: 7` and `sdd.paths`.
- `product.md`: `id`, optional `summary`, `category`, `tags`, `authors`,
  `license`, `limitations`, H1, lead description, and optional `## Intent`.
  `summary` is one line of at most 400 characters, `category` is lowercase
  kebab-case, `authors` are `{ name, url? }` records, and `license` is an SPDX
  identifier. Report hosts read those four as portable Product identity and
  attribution, so a model intended for a Blueprint authors them.
- `taxonomies.yaml`: `scenarioKinds` entries with `id`, `name`, `description`,
  and optional `colorSlot`.
- Actor: optional `## Information kept` for what the Product keeps about them; required `kind: person|system` and `relationship: external|internal`,
  H1, and lead description. An external system is an Actor only when it
  initiates; a system the Product calls out to is a Capability dependency.
- Interface: required `type`
  (`web|mobile-app|desktop-app|cli|api|webhook|messaging|voice|device|agent`),
  at
  least one `actors` relation; optional Product-facing
  `entryPoints`, each keyed by this Interface's own type or by another
  Interface's id when a reader arrives from that surface; H1, lead description,
  and `## Capability boundary`. Interfaces
  are inbound. An outbound connection the Product opens is not an Interface:
  model it in the calling Capability, give that Capability an availability
  Context for where the Actor observes the result, and make its failure a
  Capability Scenario.
- Experience: at least one `actors`; `access`
  (`public|authenticated|restricted`); optional Interface-keyed `entryPoints`;
  H1, lead description, and `## Capability boundary`. The collection is
  optional. For every Interface using Experiences, their Actor union covers all
  Interface Actors.
- Capability: optional `entities` naming what it **changes** (never what it merely reads); at least one `availability` Context; optional singular
  `domain`; H1 and lead description. Every Capability needs a Capability
  Scenario for every availability Context: a gap is an error at complete
  coverage and a warning at draft or partial coverage.
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
- Entity: H1, lead description, and at least one of `## Information kept` (a
  single-line bullet list of what the Product keeps about the thing) and
  `## States` (H3 names with prose). Optional `domain`. Optional `relations`,
  each `{ entity, verb, cardinality }` where cardinality states both ends source
  to target — `one-to-one`, `one-to-many`, `many-to-many`; `many-to-one` is
  refused and declared from the other Entity instead. Declared on one side only —
  the inverse is derived, two Entities relating back at each other is a warning,
  and a relation targets an Entity, never an Actor. `transitions` is required exactly when `## States` is
  present, each `{ from, to, by }` where `by` names the Capability that causes
  the move and must list this Entity. `## Relations` and `## Transitions` are
  invalid sections — the frontmatter list is the one authority — and `state` is
  never valid on an Entity's assets or References. An Entity is a thing an Actor
  points at and the Product tells apart — identity, not storage. Never a data
  model: no types, no keys, no foreign keys. Also never a representation of
  another Entity (a serialization or export is that thing in another shape), a
  receipt the Product keeps to work safely (ask who the record is for), or the
  Product's own surfaces, shipped content and closed vocabularies — where there
  are no instances, only members of a fixed list, that is a vocabulary. For a family of candidates sharing a
  word, write `## Information kept` before deciding how many Entities there are:
  one if a single list is true of all of them, several the moment it needs
  "depending on the kind". Where one list is a subset of another the
  intersection proves nothing: ask whether the smaller one has an address of its
  own — a file, a route, a scope a command accepts. Containment is storage and
  storage is never the test, and the closed-vocabulary exclusion reads against
  the thing you would name, not the classification above it. Stored and rendered alike is not the test. When close,
  split — a merge stays available, a collapse leaves nothing saying the question
  existed. It must be referenced by a Capability that
  changes it or a Screen that presents it; a relation from another Entity does
  not count.
- Screen: at least one `capabilities` relation, optional `entities` naming what it presents, (it has no `availability` — its
  path is its place);
  optional Interface-keyed Product entry points; H1, lead, bullet
  `## Information presented`, optional bullet
  `## Available actions`, optional H3 `## View states`, and
  `## Capability boundary`. Each information or action item occupies one
  physical line. The whole collection is optional.
- Business Rule: a non-empty `appliesTo` list of typed `capability`,
  `capability-scenario`, `journey`, `journey-scenario`, or direct `context`
  targets; H1 and lead assertion; optional `## Rationale`.
- Journey: at least one unique `actor`, H1, no lead prose, `## Goal`, and
  `## Success criterion`. A
  Journey is a stable goal, not a route or Capability wrapper. Every Journey
  needs achieved Journey Scenario coverage for every Journey Actor. It has no
  `entryPoints`; resolve presentation routes from the first Actor-owned placed
  Step's Context place and its Interface or Experience.
- Journey Scenario: taxonomy `kind`, `result: achieved|not-achieved`, named
  `routes`, and ordered non-empty typed `steps`. A Step may name a Capability.
  An achieved Scenario traverses at least two distinct Capabilities.
- `coverage.md`: `status`, `method`, `sourceAreas`, `unmapped`, `limitations`,
  H1, and lead rationale with no H2 sections. Status is model breadth only:
  `draft|partial|complete`. A complete model has at least one Capability.

Both Scenario types have no lead prose, author `routes` and `steps` in
frontmatter, require `## Trigger` and `## Outcome`, and forbid Markdown
`## Steps`. Each structured Step needs single-line `text` and
`kind: actor|product|condition`; Actor Steps require `actor`, and other kinds
forbid it. A Step may also declare `changes`, a list of what it does to
the Product's Entities — one entry `{ entity, effect, state }` per Entity and
never two for the same one, because one observable act can move several and
splitting it into a Step each would turn an acceptance case into an
implementation trace. `entity` must be one the Step's Capability declares.
`effect` is `creates|changes|removes` and defaults to `changes`. `state` must be
a state that Entity has; under `changes` some transition must reach it by that
Capability, under `creates` none is required because a creation has no `from`,
and `removes` refuses a state outright. Author the changes on the Step that
performs them, not on the condition that observes them — a transition no Step is
ever shown making is a finding against the Entity. A Step may also declare `reads`, a bare list
of Entity ids it picks, inspects, or displays without changing. The two keys are
deliberately unlike: `changes` is structured and policed and is what "what can
alter this thing" is derived from, while `reads` carries no effect, no state,
never counts as a change, and never keeps an Entity from being an orphan. Name
an Entity in one or the other, never both. A Capability that only presents a
thing still declares nothing in its own `entities`. Optional `## Edge cases` is a non-empty single-line bullet list. Journey-only
Goal and Success criterion sections are invalid on Scenarios, Scenario-only
sections are invalid on Journeys, and every recognized H2 appears at most once.
Optional `## Decision points` uses an H3 title, a question, and at least two
`condition → outcome` branches that converge on the Scenario's one result. A
branch that changes the Capability sequence or terminal result is a separate
Scenario. `kind` describes the nature of the variation; `result` describes the
terminal Journey goal outcome, so the fields are orthogonal.

A Capability Scenario in full. One route still declares `routes`; Steps carry
`text` and `kind`, an `actor` Step names its Actor, and each Step maps every
declared route id to one Context place:

```markdown
---
kind: primary
routes:
  web: Web
steps:
  - text: The Reader provides a collection name
    kind: actor
    actor: reader
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The Product creates a private collection owned by that Reader
    kind: product
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The empty collection is ready to edit
    kind: condition
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

Context is the single model concept for where behavior applies. In schema 7 it
is a strict object containing one `place` field. A Capability's availability
Contexts name an undivided Interface or an Experience:

```yaml
availability: [{ place: reader-web::personal-library }, { place: reader-mobile::personal-library }, { place: operator-cli }]
```

An Experience belongs to exactly one Interface, so its id already names it. A
Context place either names a declared Interface, Experience, or Screen or it
does not. An Interface holds either `screens/` or `experiences/`, never both. Availability is intended
Product meaning, not implementation status.

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

Scenario Actors, availability places, Screen participation, and backlinks
derive from Step Contexts. Every Actor must be supported by at least one
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

## Verification edit boundaries

Missing References are valid at every Coverage status. Product meaning may
change only in `product.md`, taxonomies, coverage prose, and resource
prose/relationships after approval. A post-alignment navigation refresh may
change only implementation References.

## Canonical `.businesslens/README.md`

When the internal scoped-map protocol creates a Product Model, write this
orientation exactly:

```markdown
# Product Model

This directory is a **BusinessLens Product Model**: what this product does and
for whom. It is plain Markdown tracked in Git, and it is the source of truth for
intended product behavior.

## If you are an agent working in this repository

- Read `product.md` or `product/product.md` first, then Actors and
  Interfaces, optional Experiences, Screens, and Domains, followed by
  Capabilities, Business Rules, Journeys, and both Scenario collections.
- Expect leaf resources as `<id>.md`; `<id>/<type>.md` means that resource owns
  child resources or assets.
- Treat Capability Scenarios as local acceptance contracts, Journey Scenarios
  as end-to-end Steps contracts, and Business Rules as invariants.
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
