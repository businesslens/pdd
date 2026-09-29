# Product Model format

Author current, approved product meaning. Do not persist alternatives considered,
rejected approaches, explanations of why another option was not selected, or
deliberation history anywhere in `.businesslens/`, including resource prose,
supporting sections, limitations, README, and additional files. Keep discussion
needed to reach a decision in the conversation; record the resulting behavior
without replaying settled discussion on later runs. An unchosen option is not a
product exclusion: record exclusions only when they are established or approved
product constraints. Preserve observable refusal and failure behavior, current
constraints, and material unresolved questions or missing evidence. Structural
lint does not determine whether prose contains deliberation history.

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
│   ├── screens/<id>/screen.md               # expanded; may hold screens/ of its own
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
├── business-rules/<id>.md                   # optional collection
└── variations/<id>.md                       # optional collection
```

Use `<id>.md` while a resource has no assets or child resources. When it gains the
first one, move it to `<id>/<type>.md` and keep owned assets beside that file.
Put generated implementation captures under `implementation/`. The compact and
expanded forms never coexist and derive the same id. Optional `assets:`
frontmatter annotates existing files with `title`; it never creates or
classifies an asset, and there is no `state` key: a screenshot of a state
attaches to the Scenario or Edge case that reaches that state.

Use these exact compact and expanded paths:

| Resource type | Compact | Expanded | Typed children |
| --- | --- | --- | --- |
| Product | `product.md` | `product/product.md` beside `logo.svg` | — |
| Interface | `interfaces/<id>.md` | `interfaces/<id>/interface.md` | `screens/`, `experiences/`, or both |
| Experience | `interfaces/<interface-id>/experiences/<id>.md` | `interfaces/<interface-id>/experiences/<id>/experience.md` | `screens/` |
| Screen | `<screen-parent>/screens/<id>.md` | `<screen-parent>/screens/<id>/screen.md` | `screens/` |
| Domain | `domains/<id>.md` | `domains/<id>/domain.md` | — |
| Entity | `entities/<id>.md` | `entities/<id>/entity.md` | — |
| Capability | `capabilities/<id>.md` | `capabilities/<id>/capability.md` | `scenarios/` |
| Capability Scenario | `capabilities/<capability-id>/scenarios/<id>.md` | `capabilities/<capability-id>/scenarios/<id>/capability-scenario.md` | — |
| Journey | `journeys/<id>.md` | `journeys/<id>/journey.md` | `scenarios/` |
| Journey Scenario | `journeys/<journey-id>/scenarios/<id>.md` | `journeys/<journey-id>/scenarios/<id>/journey-scenario.md` | — |
| Business Rule | `business-rules/<id>.md` | `business-rules/<id>/business-rule.md` | — |
| Variation | `variations/<id>.md` | `variations/<id>/variation.md` | — |

Here `<screen-parent>` is the Interface, Experience or expanded Screen folder
that contains the Screen: Screens nest, to any depth. There is no `actors/`
collection: **an Actor is an Entity that `acts`**, and the word names the role
such an Entity plays on a Step, an Interface, an Experience, a Journey, or a
Business Rule grant.

IDs are lowercase kebab-case segments. Behavior-hierarchy and cross-cutting ids
are the bare file or folder name. Qualified ids for Interfaces, Experiences,
and Screens carry their path joined by `::` —
`reader-web::personal-library::unread-library` — because Experience and Screen
names repeat across Interfaces on purpose. A nested Screen adds one segment per
level — `customer-web::storefront::onboarding::choose-plan` — and containment
is by id prefix: a Step on a child is inside the parent, and a Rule selector on
the parent covers the child. Two resources of the same kind sharing
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

- `config.yaml`: exactly `schema: 10` and `sdd.paths`.
- `product.md`: `id`, optional `summary`, `category`, `tags`, `authors`,
  `license`, `limitations`, `languages`, H1, lead description, and optional
  `## Intent`. `summary` is one line of at most 400 characters, `category` is
  lowercase kebab-case, `authors` are `{ name, url? }` records, and `license`
  is an SPDX identifier. Report hosts read those four as portable Product
  identity and attribution, so a model intended for a Blueprint authors them.
  `languages` is a unique list of language tags the Product serves — `en`,
  `de-DE`, `pt-BR`, each matching `^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$`; an
  Interface may narrow it, and Experiences and Screens never carry it.
- `taxonomies.yaml`: `scenarioKinds` entries with `id`, `name`, `description`,
  and optional `colorSlot`.
- Interface: required `type`
  (`web|mobile-app|desktop-app|cli|api|webhook|messaging|voice|device|agent`),
  at least one `actors` entry naming an Entity that `acts` — **who uses** the
  Interface, a descriptive list, never a permission claim; optional
  Product-facing `entryPoints`, each keyed by this Interface's own type or by
  another Interface's id when a reader arrives from that surface; optional
  `languages`, a subset of the Product's (listing any while the Product
  declares none is an error); optional `navigation`; H1, lead description, and
  optional `## Intent`. `## Capability boundary` is an error: `availability`
  on Capabilities already says what an Interface offers. `navigation` is a
  unique list of Screen paths relative to the Interface (`catalog`,
  `library::by-source`) that are reachable from every place inside it — a
  cart, a global search. On a divided Interface only shared Screens (those
  beside `experiences/`) and their descendants qualify. Order carries no
  meaning. It is structure, not a relation: it creates no transition, and
  nothing else about navigation — menus, sitemaps, back links, the order of
  items — is authored. Interfaces are inbound. An
  outbound connection the Product opens is not an Interface: model it in the
  calling Capability, give that Capability an availability Context for where
  the Actor observes the result, and make its failure a Capability Scenario.
- Experience: non-empty `actors` supported by the owning Interface; required
  `access` (`public|authenticated|restricted`), the most open the context can
  be — a setting that closes it is a grant's `when` on the operations it
  restricts, never a reason for an Experience of its own; optional Interface-keyed
  `entryPoints` and relative `navigation`; H1, lead and optional `## Intent`.
  `## Capability boundary` is an error. Disjoint audiences require
  division; distinct access modes, counterparts or membership in a Variation
  justify existing Experiences. A Variation may span Interfaces without
  changing ownership.
  Their Actor union equals the Interface's Actors.
- Capability: at least one `availability` Context — every Experience in which
  one of its Actors uses it (guests in a public one, signed-in Users in an
  authenticated one), each with its own counterpart Screen unless every
  Experience shares it, never only the most open; optional singular `domain`; H1
  and lead description. **It declares nothing about Entities** — what it changes
  is what its Scenarios' Steps say, and a file still carrying `entities` is
  refused. Every Capability needs a Capability Scenario for every availability
  Context: a gap is always an error. **Split by contract:** parts of an ability
  are separate Capabilities when they differ in who may do them (a permission of
  their own), where they are offered (availability), or in verb — create,
  configure, archive and delete are four. A different Actor does not split one
  (it is offered in every Experience it is used from), and neither does a
  Business Rule governing only one part. Ways of doing one verb that share all
  of those are Scenarios of one Capability, even when each creates a different
  Entity: adding an authenticator app or backup codes as a second factor is one
  Capability. Ways a setting selects between follow the Variation rules instead:
  a sign-in method the deployment selects makes one Capability per method, while
  methods that coexist, the Actor choosing one at sign-in, are Scenarios of one.
  The Steps of one run are one Capability, including a link or code the run
  sends when the run has no outcome for the Actor without it: requesting a
  password reset and choosing the new password are one, and resending the link
  is a Scenario of it. A later act on something a run already produced —
  confirming the email of an account that exists — is its own Capability. A
  continuation shared by several Capabilities (entering a second factor after
  any sign-in method) is its own Capability: the ones it continues end their
  Scenarios at the hand-off, stating it in their Outcome, and a Journey joins
  them, since no Capability Scenario names another Capability.
- Capability Scenario: taxonomy `kind`, named `routes`, and ordered typed
  `steps`. Its parent Capability is implicit on every Step.
- Domain: H1, lead description, and `## Boundary`; optional `colorSlot`. A
  Domain is a region of subject matter, classifying members of the Interface →
  Experience → Screen and behavior hierarchies. Only Capability authors
  `domain:`; every other Domain relation is derived. Its `## Boundary` must
  state something the Domain does **not** own, and a Domain naming fewer than
  two Capabilities is a warning. Create Domains from the Product's own sections
  — the areas its navigation, settings and administration group things under —
  one per section holding two or more Capabilities (the finest navigation level
  that still holds two or more; a parent menu is a section only when none of its
  children is), named in the Product's words; a Capability no section reaches
  (one only an emailed link or a schedule starts) joins the section whose
  Entities it changes. For a planned Product, use the planned sections. Domains
  already in the model are the author's: add new Capabilities to them and never
  re-cut, merge or rename them.
- Naming: a behavioral id's noun half names something the model declares —
  `install-agent-skills`, not `install-skills`, when `agent-skills` is an
  Interface. Entity, Domain and Business Rule ids never open with a verb; they
  name what a thing is or what must remain true.
- Entity: H1, lead description, and at least one of `## Information kept`,
  `## States`, and `acts`. `## Information kept` is a bullet list of **named**
  single-line facts, each `- **Name** — prose` with an em dash as the only
  separator, names unique within the Entity; a Business Rule's `facts`, a Screen's
  `entities` entry and a Step's `entities` entry cite a fact by that exact
  name. `## States` is H3 names with prose;
  the first listed state is the one a thing starts in. **The Entity declares
  its states and nothing about the moves between them**: the lifecycle is
  composed from Scenario Steps, there is no `transitions` key, and a file still
  carrying one is refused. `## Relations` and `## Transitions` are invalid
  sections.
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
- Screen: optional `entities`, Interface-keyed `entryPoints`, H1, lead and
  optional `## Intent`; no authored `capabilities` or `availability`.
  Capabilities derive from Steps placed exactly here (the owner for a Capability
  Scenario, the Step's `capability` for a Journey Scenario); at least one is
  required. Parent and child sets remain separate. Each Entity entry is a bare
  id only for an Entity without named facts, or `{ entity, shows?, collects? }`
  with at least one non-empty list of unique exact fact names. `shows` is
  disclosure; `collects` is Actor input, not read permission. Both may name a
  prefilled editable value. Nest Screens only to subdivide a parent's persistent
  working context; merely opening a destination never makes it a child. Shared
  destinations belong once at their common Interface or Experience container.
  `## Information presented`, `## Available actions`, `## View states` and
  `## Capability boundary` are invalid; other H2s are supporting content.
- Business Rule: a durable constraint, derivation, or permission — H1 and lead
  assertion, optional `## Intent` and `## Rationale`, and a non-empty
  `appliesTo` list of typed `capability`, `capability-scenario`, `journey`,
  `journey-scenario`, direct `context`, or `entity` targets. The H1 states the
  assertion about what the targets select: a permission names the operation
  and who may perform it ("Only the owner reads an unpublished collection"), an
  invariant what always holds. A consequence, a feature, or the mechanism
  behind the Rule belongs in the lead or `## Rationale`, never the title; from
  the title and `appliesTo` alone, the grants' who is no surprise. An Entity
  target is `{ type: entity, id, effect?, from?, to?, facts?, contexts? }`: **a target
  selects; a grant conditions.** `effect`, `from` and `to` select Steps by the
  keys their `entities` entry carries (`from` with `changes|removes`, `to` with
  `creates|changes`, neither with `reads`); `facts` names the facts it governs;
  `contexts` resolves to existing places. Without `permits`, each place must
  present the Entity and a governed fact when fact-scoped, or contain a Screen
  that does. Permission Rules need no matching disclosure or operation.
  A fact-scoped read target selects
  Screens that `shows` a governed fact and Steps that read it. Collected inputs
  are not disclosure. A Rule may govern a fact nobody currently reads; a
  prohibition never requires an example of its violation. A `from` that
  every selected Step already leaves from is a warning — the minimal selector
  is canonical. Optional `permits`: omitted means no authorization claim, `[]`
  means forbidden to everyone, a list means permitted through any one grant.
  Grants are OR, keys within a grant are AND, Rules selecting the same
  operation are AND, and an operation no permission Rule selects is open. A
  Rule with `permits` targets Entities only. Every grant names a who — one of
  `actors` (Entities that act), `related` (a path of `{ verb, entity }`
  segments from the Rule's one Entity target, walking relations and their
  inverses, ending on an Entity that acts; a Rule using it, a defaulted `fact`
  or a `state` condition has exactly one Entity target, so split a Rule that
  needs more), `self: true` (the instance itself),
  `unattended: true` (the Product's own schedule), `configuredBy` (an Entity
  holding customer configuration) — plus optional `when`, a list of AND-ed
  conditions, each `{ fact, <operator>: value }` with one of
  `over|under|at-least|at-most|is|is-not|present|absent`, optionally
  `entity` to read another Entity's fact, or `{ state: X }` for the instance's
  current state (valid on every target but `creates`, needed because reads and
  information changes carry no state to select by). A value is a scalar or
  `{ configuredBy: <entity-id> }`. Permission claims appear only here. One
  encoding per case: a flag deciding whether someone may perform an Entity
  operation conditions a grant; two or more complete, supported forms of one
  resource chosen by a setting, assignment or version are a Variation (an A/B
  test whose arms differ in one Step is an Experiment of two
  Scenarios); a looks-only difference is design; a branch on state the behavior
  meets is Scenario conditions and outcomes, or Rules spanning behaviors. No
  structured `when` exists on Capability targets. The experiment engine and
  messages are ordinary Product Entities and behavior only when that is the
  Product's purpose.
  A Rule
  on exactly one behavioral target with no `contexts` is a warning; Entity and
  Context targets are always valid. Rationale explains the current condition or
  consequence that makes the constraint necessary; it never recounts alternative
  designs or why they were rejected.
- Journey: at least one unique `actors` entry, H1, no lead prose, `## Goal`, and
  `## Success criterion`. A Journey is a stable goal, not a route or Capability
  wrapper. Write every Journey the test finds: one exists wherever the Product
  itself carries an Actor from one Capability into another toward one outcome —
  a redirect, a required next Step, an emailed link to follow — and never where
  the Actor merely chooses to do something else next. Returning the Actor to
  where they were already going after signing in is not a hand-off, and neither
  is a continuation the Product runs without the Actor, such as merging
  automatically once checks pass. The test is structural, so "omit rather than
  assert" does not apply to it. Every Journey needs achieved Journey Scenario
  coverage for every Journey Actor. It has no `entryPoints`; resolve
  presentation routes from the first Actor-owned placed Step's Context place and
  its Interface or Experience.
- Journey Scenario: taxonomy `kind`, `result: achieved|not-achieved`, named
  `routes`, and ordered non-empty typed `steps`. A Step may name a Capability,
  and must when its `entities` carries a `creates`, `changes` or `removes`
  effect. An achieved Scenario traverses at least two distinct Capabilities.
- `coverage.md`: frontmatter with exactly `scope`, `method`, `covered`,
  `exclusions`, `unmapped` and `limitations`, and a body of only `# Coverage`.
  There is no status.

```markdown
---
scope: The intended Product behavior.
method: Authored from discussion of intended behavior.
covered:
  - description: Customer checkout and order tracking.
    paths: []
exclusions: []
unmapped: []
limitations: []
---

# Coverage
```

`scope` is the model's intended breadth in one line; `method` is one short line
on how it was authored, or `""`. `covered` is represented behavior,
`exclusions` approved omissions (never turn skipped work into one), `unmapped`
known behavior within scope that is not modeled, and `limitations` material
uncertainty (not missing behavior, and not "code was not executed"). Each entry
is `{ description, paths }`: a one-line description, unique across all four
lists, of one coherent behavior with all its paths. Paths are repository-relative,
directories end in `/`, and `[]` means no known location; no traversal, `*` or
`?` wildcards, URLs, backslashes or fragment/line suffixes, while brackets, as
in `pages/[id].vue`, are ordinary. An empty `unmapped` list never means complete,
and known gaps never relax structural checks. Blueprints keep descriptions and
drop paths.

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
entry is `{ entity, as?, effect, from?, to?, facts? }`: `effect` is
`creates|changes|removes|reads`, defaulting to `changes`; `creates` takes
`to`, `removes` takes `from`, `changes` takes both or neither, `reads` neither.
Every state resolves. `facts` is required on reads, changes and creation: the
exhaustive unique list of named Product facts affected, including defaults on
creation. `[]` explicitly names no facts, never unspecified. Removal has no
authored `facts`. An Actor read on a Screen must occur in that Screen's `shows`;
Product and condition Steps may consult undisplayed facts. A Step can
move several things, so a Step lists as many as it changes, one entry per
`(entity, as)` pair. `as` is a scenario-local instance alias for two instances
of one Entity in one Scenario; once aliased anywhere in the Scenario, aliased
everywhere. Where an earlier Step left an `(entity, as)` pair in a state, a
later Step's `from` for it must match. `reads` is a bare mention: no state,
never a change, never enough to keep an Entity from being an orphan. Author
the effects on the Step that performs them. After drafting, re-read every
Step's `text` against the Entity list and complete its `entities`: a Step
whose text names an Entity title it does not declare is an error,
exempting the Step's own `actor` and the phrase "The
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
      - { entity: collection, effect: creates, to: Private, facts: [Name, Item order] }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The empty collection is ready to edit
    kind: condition
    entities:
      - { entity: collection, effect: reads, facts: [] }
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
every Step carrying `{ entity: order, effect: changes, to: Refunded, facts: [] }`; the
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
`{ entity: order, effect: changes, from: Confirmed, to: Refunded, facts: [] }` is what
puts Refunded on the machine. `lint` composes every Scenario and warns on an
**unreached state** — a state other than the first that no Step leaves anything
in — and an **unproduced origin** — a Step leaving `from: Confirmed` when
nothing produces Confirmed and it is not the first state.

Context is the single model concept for where behavior applies. In schema 10 it
is a strict object containing one `place` field. A Capability's availability
Contexts name an undivided Interface or an Experience:

```yaml
availability: [{ place: reader-web::personal-library }, { place: reader-mobile::personal-library }, { place: operator-cli }]
```

An Experience belongs to exactly one Interface, so its id already names it. A
Context place either names a declared Interface, Experience, or Screen at any
depth or it does not. An Interface holds `screens/`, `experiences/`, or both. A Screen
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
shared by all routes and has no Context. Name the Screen when the Step occurs
on one, otherwise the leaf Experience or undivided Interface even if other
behavior there has Screens. A parent Screen is a place of its own; a Step
there is on the parent, not in a child. Every route is placed at least once and no two routes repeat one
place sequence. A place change between
consecutive placed Steps is a Context place transition.

Scenario Actors, Entities, availability places, Screen participation, and
backlinks derive from Steps. Every Actor must be supported by at least one
selected Context place and every derived availability place must support a
Scenario Actor. A Capability-bearing Context place must be inside that
Capability's availability. A Screen's Capabilities derive from placed Steps;
there is no independent claim to reconcile. A Capability need not have a Screen.
Transitions derive from consecutive contextualized Steps. Every Journey
route begins its Actor-owned
placed Steps with a Journey Actor. Screens never author Scenario ids.

Every semantic resource may contain optional `references`. Each strict item needs
`kind: code|prd|spec|proposal|doc|adr|visual|research`,
`role: intent|implementation|context`, `target`, and optional `title`. Code
targets use `path[#symbol][:start[-end]]` and their path must be tracked. Other
targets use HTTP(S) or a repository-relative path. Duplicate targets on one
resource are invalid, and neither References nor `assets` carry a `state` key.
References are attachments, never proof or lifecycle state.
Coverage, config, and taxonomies do not accept them.

## Findings on places and facts

All structural checks apply regardless of Coverage. Lint rejects unresolved
navigation, Entity or fact references, duplicate entries, a Screen without any
placed Capability, and an Actor read of information its Screen does not show.
Product and condition reads are not display claims. Named facts require
shows/collects on Screens. Step facts are required on reads, changes and creates,
and forbidden on removal. Language lists must be valid Product subsets.
Authored Screen `capabilities`, `screens` on a container, reference/asset `state`, and removed Screen prose sections are errors.
A prohibition is valid with no example of the prohibited behavior.

`.gitignore` contains `build/` and `cache/`.

## Verification edit boundaries

Missing References are valid. Product meaning may
change only in `product.md`, taxonomies, Coverage descriptions, and resource
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

## Variations

A Variation is a named set of two or more currently supported alternatives of
one resource type: Interface, Experience, Screen, Entity, Capability, Capability
Scenario, Journey, Journey Scenario or Business Rule. Product, Domain and
Variation itself cannot vary. The set is its own resource, `variations/<id>.md`; alternatives stay
ordinary, independently complete resources and carry no Variation keys.

```yaml
# variations/refund-review.md
kind: configuration          # experiment | configuration | version
of: business-rule            # the one member type
settings:
  - { entity: store-settings, fact: Refund review mode }
takesEffect: When a refund is requested. A settings change applies to subsequent requests.
stability: A refund already under review keeps the policy captured when it was requested.
alternatives:
  - id: refund-review-standard
    selectedWhen: Refund review mode is Standard. Missing mode uses Standard.
  - id: refund-review-strict
    selectedWhen: Refund review mode is Strict.
---

# Refund review

Stores choose how strictly refunds are reviewed; both policies are supported.
```

The H1 names the choice; the lead says why the alternatives coexist. `## Intent`
is optional.

**Membership lives only on the set.** `alternatives` lists at least two distinct
resources of the type `of` names, by that type's ordinary ids (a Screen's full
`interface::experience::screen`). A resource belongs to at most one Variation.
The list is a set; its order means nothing.

**Vary the smallest resource that fully contains the difference.** One Step
that differs: two Scenarios of one owner (`of: capability-scenario` or
`journey-scenario`), never two Capabilities; a Scenario Variation whose
alternatives have different owners is a `lint` error. The ability's contract,
availability or Actors: Capabilities. A place: Screens or Experiences. The facts
or States kept: Entities. A Step is never an alternative. Steps, Screens and
Rules name one concrete alternative, so a varying Entity carries into the
Scenarios that touch it, selected the same way; when only the path differs, vary
the Scenarios and keep one Entity with every State.

**What selects decides it.** A Variation chooses by a fact that exists to
choose — a setting, an experiment assignment, a version discriminator — or by
the deployment, fixed before the behavior starts. A fact describing the thing
the behavior acts on (a page's own editor format) is state: a `condition` Step
or decision point reads it, even when someone set it earlier. Scenarios vary
only when what an Actor does differs and one setting alone decides it: sign-in
that starts at the only provider automatically drops the Actor's choice, so it
selects the sign-in Scenario. When two or more settings would each vary or split the
same Scenario, whether they change the Actor's Steps or the outcome (a captcha and a provider password on one registration), none
makes a Variation; each is a decision point. A setting changing only the
Product's own Steps (group sync replacing or adding Roles) is a decision point
in one Scenario, as is any choice made during a run — except a Step that must
name a different alternative of another Variation (a VAT invoice or a sales tax
receipt), which varies with it. A Product-only setting that changes the outcome
(registration requiring email confirmation leaves the account inactive; an
unknown social account is registered or refused) makes separate Scenarios with
a `condition` Step, never a Variation. The
unconfirmed account sign-in later meets is state. A resource that exists only
under some alternatives or only while a setting enables it (registration while
the sign-in method is password; social sign-in while a provider is configured)
stays ordinary, and a Business Rule without `permits` applying to it names the
Variation or the setting in its lead.

**Each selection field has exactly one level.** All text is a non-empty Markdown
fragment without H1/H2.

| Field | Level | Meaning |
| --- | --- | --- |
| `selectedWhen` | alternative | Eligibility and the choice selecting this alternative, including missing/unsupported choices and defaults |
| `takesEffect` | set | When selection is made or re-evaluated, including changes during use |
| `stability` | set | How long the choice remains fixed and what happens to existing clients, sessions or records when it changes |

`kind` decides the remaining fields; a field outside the subtype is a `lint`
error. A fact reference is exactly `{ entity: <id>, fact: <name> }` and must
resolve to an Entity and one of its Information kept facts.

| `kind` | Set fields | Alternative fields |
| --- | --- | --- |
| `experiment` | Required `assignmentUnit` (`{ entity: <id> }`, or `{ description: <text> }` for an unmodeled unit such as a session) and `assignmentMethod`. Optional `assignmentFact` and `allocation`. | — |
| `configuration` | Optional non-empty `settings`: distinct facts that choose between the alternatives. A fact that only tunes one alternative's behavior is not a setting. | — |
| `version` | Optional `discriminator`: the kept fact identifying the version. | Required `label`, unique in the set ignoring case. |

The subtype states why alternatives coexist: Experiment evaluates outcomes;
Configuration selects through a setting or operating context; Version keeps
contracts or forms live together. A version selected by a setting stays
Version; an experiment enabled by a setting stays Experiment. Header or path
selection is explained in `selectedWhen`; do not invent an Entity to hold it,
and do not create Entities solely to fill these fields.

**When a Variation is justified.** Two or more resources of one type are all
supported now and something decides which applies. Otherwise: a condition inside
one ability is a Scenario decision point; a parameter value (a threshold, a
limit) is content of the one resource; phases are Entity States; the same
Experience on another Interface is a counterpart; a look-only treatment is a
`visual` Reference. Every alternative is currently supported; none is a
default, parent or historical version. When one alternative is left, remove the
Variation and keep still-relevant meaning in ordinary content.

A Variation is a relation, never containment: folders, Domains, Experience
ownership, Screen nesting and Scenario parents stay as they are, and Rule
targets, Steps and Contexts keep naming concrete resources. Membership justifies
Experiences that would otherwise flatten. A Business Rule that is an
alternative applies only while selected, never unconditionally, so `lint`
does not check its grants against Steps and Screens; `verify` does. A Variation
grants no permission. An Entity that is an assignment unit or holds a fact a
Variation chooses by is not an orphan.

**Evidence, not invention.** Record only selection the evidence or approved
intent establishes. Omit an optional field the evidence does not establish,
say so in a required one such as `takesEffect`, and record the gap as
unresolved in Coverage. `lint` validates structure and references, never
whether conditions are exhaustive.
