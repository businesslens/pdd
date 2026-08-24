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

Use `<id>.md` while an entity has no assets or child entities. When it gains the
first one, move it to `<id>/<type>.md` and keep owned assets beside that file.
Put generated implementation captures under `implementation/`. The compact and
expanded forms never coexist and derive the same id. Optional `assets:`
frontmatter annotates existing files with `title` and, on Screens only, a
Product-state `state`; it never creates or classifies an asset.

Use these exact compact and expanded paths:

| Entity | Compact | Expanded | Typed children |
| --- | --- | --- | --- |
| Product | `product.md` | `product/product.md` beside `logo.svg` | — |
| Actor | `actors/<id>.md` | `actors/<id>/actor.md` | — |
| Interface | `interfaces/<id>.md` | `interfaces/<id>/interface.md` | `screens/` or `experiences/`, never both |
| Experience | `interfaces/<interface-id>/experiences/<id>.md` | `interfaces/<interface-id>/experiences/<id>/experience.md` | `screens/` |
| Screen | `<scope>/screens/<id>.md` | `<scope>/screens/<id>/screen.md` | — |
| Domain | `domains/<id>.md` | `domains/<id>/domain.md` | — |
| Capability | `capabilities/<id>.md` | `capabilities/<id>/capability.md` | `scenarios/` |
| Capability Scenario | `capabilities/<capability-id>/scenarios/<id>.md` | `capabilities/<capability-id>/scenarios/<id>/capability-scenario.md` | — |
| Journey | `journeys/<id>.md` | `journeys/<id>/journey.md` | `scenarios/` |
| Journey Scenario | `journeys/<journey-id>/scenarios/<id>.md` | `journeys/<journey-id>/scenarios/<id>/journey-scenario.md` | — |
| Business Rule | `business-rules/<id>.md` | `business-rules/<id>/business-rule.md` | — |

Here `<scope>` is either an Interface folder or an Experience folder.

IDs are lowercase kebab-case segments. Behavior-tree and cross-cutting ids are the bare file or folder name. Surface-tree ids
(Interface, Experience, Screen) carry their path joined by `::` —
`reader-web::personal-library::unread-library` — because surface names repeat
across Interfaces on purpose. Two entities of the same kind sharing a path
suffix below their Interface are counterparts: the same thing on two surfaces.

The path owns every parent relation. An Experience never writes `interfaces:`,
a Capability Scenario never writes `capability:`, a Journey Scenario never
writes `journey:`, and a Screen never writes `availability:`. Capability
Scenario and Journey Scenario IDs share one global namespace. Only
`product.md` declares `id:`. The
first and only H1 is the title. Most entities use lead prose as their description;
Journeys and both Scenario types instead use required named sections and must
not contain lead prose. Put relations and navigation in frontmatter and Product
meaning in prose. Product tags and every relation ID list contain unique
values. Each recognized H2 appears at most once; unrecognized H2 sections are
preserved as structured supporting content. Lead and section-body fragments do
not contain another H1 or H2.

## Required shapes

- `config.yaml`: exactly `schema: 5` and `sdd.paths`.
- `product.md`: `id`, optional `tags`, `limitations`, H1, lead description, and
  optional `## Intent`.
- `taxonomies.yaml`: `scenarioKinds` entries with `id`, `name`, `description`,
  and optional `colorSlot`.
- Actor: required `kind: person|system` and `relationship: external|internal`,
  H1, and lead description. An external system is an Actor only when it
  initiates; a system the Product calls out to is a Capability dependency.
- Interface: required `type`
  (`web|mobile-app|desktop-app|cli|api|webhook|messaging|voice|device`), at
  least one `actors` relation; optional Product-facing
  `entryPoints`; H1, lead description, and `## Capability boundary`. Interfaces
  are inbound. An outbound connection the Product opens is not an Interface:
  model it in the calling Capability, scope availability to where the Actor
  observes the result, and make its failure a Capability Scenario.
- Experience: at least one `actors`; `access`
  (`public|authenticated|restricted`); optional Interface-keyed `entryPoints`;
  H1, lead description, and `## Capability boundary`. The collection is
  optional. For every Interface using Experiences, their Actor union covers all
  Interface Actors.
- Capability: at least one exact `availability` scope; optional singular
  `domain`; H1 and lead description. Every Capability needs a Capability
  Scenario for every exact availability context: a gap is an error at complete
  coverage and a warning at draft or partial coverage.
- Capability Scenario: taxonomy `kind`, named `routes`, and ordered typed
  `steps`. Its parent Capability is implicit on every Step.
- Domain: H1, lead description, and `## Boundary`; optional `colorSlot`. A Domain
  is a region of subject matter, classifying members of both trees. Only
  Capability authors `domain:`; every other Domain relation is derived.
- Screen: at least one `capabilities` relation (it has no `availability` — its logical path is the scope);
  optional Interface-keyed Product entry points; H1, lead, bullet
  `## Information presented`, optional bullet
  `## Available actions`, optional H3 `## Product states`, and
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
  Step's Product Place and its Interface or Experience.
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
forbid it. Optional `## Edge cases` is a non-empty single-line bullet list. Journey-only
Goal and Success criterion sections are invalid on Scenarios, Scenario-only
sections are invalid on Journeys, and every recognized H2 appears at most once.
Optional `## Decision points` uses an H3 title, a question, and at least two
`condition → outcome` branches that converge on the Scenario's one result. A
branch that changes the Capability sequence or terminal result is a separate
Scenario. `kind` describes the nature of the variation; `result` describes the
terminal Journey goal outcome, so the fields are orthogonal.

A scope is one id: an undivided Interface, or an Experience.

```yaml
availability: [reader-web::personal-library, reader-mobile::personal-library, operator-cli]
```

An Experience belongs to exactly one Interface, so its id already names it. A
scope either resolves in the tree or it does not. An Interface holds either
`screens/` or `experiences/`, never both. Availability is intended Product
scope, not implementation status.

Business Rule target contexts name one scope id:

```yaml
context: reader-web::personal-library
```

Use a bare Interface id for an undivided Interface scope and
`interface-id::experience-id` for an Experience scope; there is no separate
`experience` field. An entity Rule target may omit `contexts` to cover all
target contexts or provide a non-empty list to narrow it. Targets are additive.
A Capability plus one of its Capability Scenarios, or a Journey plus one of its
Journey Scenarios, is redundant and invalid. Domains are derived Rule
backlinks, not authored targets.

Each Scenario route maps a stable kebab-case id to a human name. A placed Step
maps every route id to its most-specific Product Place; a Step without
`places` is shared by all routes and has no Product Place. When a scope owns Screens, the Place must name a Screen;
otherwise it names the leaf Experience or Interface. Every route is placed at
least once and no two routes repeat one Place sequence. A Place change between
consecutive placed Steps is a Product Place transition.

Scenario Actors, exact contexts, Screen participation, and backlinks derive
from Steps and Places. Every Actor must be supported by at
least one selected Place and every exact context must support a Scenario Actor.
A Capability-bearing Place must be inside that Capability's availability, and
a Screen Place must expose it. Every Journey route begins its Actor-owned
placed Steps with a Journey Actor. Screens never author Scenario ids.

Every semantic entity may contain optional `references`. Each strict item needs
`kind: code|prd|spec|proposal|doc|adr|visual|research`,
`role: intent|implementation|context`, `target`, and optional `title`. Code
targets use `path[#symbol][:start[-end]]` and their path must be tracked. Other
targets use HTTP(S) or a repository-relative path. Duplicate targets on one
entity are invalid. References are attachments, never proof or lifecycle state.
Coverage, config, and taxonomies do not accept them.

`.gitignore` contains `build/` and `cache/`.

## Verification edit boundaries

Missing References are valid at every Coverage status. Product meaning may
change only in `product.md`, taxonomies, coverage prose, and entity
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
- Expect leaf entities as `<id>.md`; `<id>/<type>.md` means that entity owns
  child entities or assets.
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
