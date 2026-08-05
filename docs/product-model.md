---
title: Model overview
description: The .businesslens/ folder models one coherent Product with required foundations and optional contexts, views, groupings, goals, and constraints.
section: open-source
group: Product Model
order: 7
---

# The Product Model

The Product Model is a Git-tracked directory of Markdown describing one
coherent Product promise: who it serves, through which supported interaction
forms, in which usage contexts, what it can do, which goals matter, and what
must remain true.

## What belongs in a model

The entities describe Product meaning rather than mirroring source files,
frameworks, commands, or endpoints. Start with the required foundation, then
add optional entities only when they communicate a real Product distinction.

| Entity | Model requirement | What it adds |
| --- | --- | --- |
| [Product](./product.md) | Exactly one | The coherent value promise and its boundary |
| [Actor](./actors.md) | At least one, because every Interface names an Actor | A Product-significant goal, privilege, trigger, or outcome |
| [Interface](./interfaces.md) | At least one | An independently supported interaction contract |
| [Experience](./experiences.md) | Optional | A durable context of use when one Interface or several Interfaces contain meaningful audience, access, or capability boundaries |
| [Screen](./screens.md) | Optional | A meaningful visual view; non-visual Products do not need one |
| [Domain](./domains.md) | Optional | A Product-language grouping that makes a larger Capability set easier to navigate |
| [Capability](./capabilities.md) | Optional by itself; required by every Screen and Journey | A durable Product ability reused across views or goals |
| [Journey](./journeys.md) | Optional | One complete Actor goal |
| [Scenario](./scenarios.md) | At least one per Journey | One concrete, observable acceptance path through that goal |
| [Business Rule](./business-rules.md) | Optional | A durable assertion that must remain true |

Do not add an Experience, Domain, Screen, or any other entity to make the model
look complete. A small model can be both valid and honest. The
[Content Feed Reader walkthrough](./feed-reader-example.md) shows a complete
example with several real relationships of every kind.

Screens are deliberately visual. A CLI or supported API does not need parallel
Command or Endpoint entities: syntax belongs in CLI help, and endpoints and
payloads belong in an API contract such as OpenAPI. Attach those artifacts as
[References](./references.md) when they help explain intent or implementation.

`taxonomies.yaml` defines Scenario kinds. `config.yaml` records folder schema
and SDD roots. `coverage.md` describes model breadth.
`.businesslens/README.md` orients an agent that encounters the model.

Use [`businesslens view`](./cli-view.md) to browse the current model as a local
report while editing.

## Authoring conventions

Entity IDs come from lowercase kebab-case filename stems; Journey IDs come from
their directories. Only `product.md` declares `id:`. Scenario IDs are unique
across the whole model, not merely within a Journey.

The first H1 supplies an entity's title. Lead prose supplies its description,
or a Journey's summary. Scenarios are the exception: they begin with the
required `## Trigger` section and have no lead paragraph. Relations and
navigation belong in frontmatter; Product meaning belongs in prose. The
frontmatter schema is a strict allowlist, so `lint` reports unknown keys rather
than silently ignoring them.

Optional `## Intent` prose explains why a Product or entity exists and which
outcome it protects. It adds meaning without becoming another entity or
relationship graph.

## Availability

Interface says the supported interaction form. Optional Experience says the
coherent Actor context within that form. Capabilities, Journeys, Screens,
Scenarios, and Business Rules declare exact availability scopes.

When an Interface has Experiences, every availability record for it names the
applicable Experiences:

| Experience | Customer web | Customer mobile | Operator CLI |
| --- | --- | --- | --- |
| Public discovery | yes | yes | no |
| Personal workspace | yes | yes | no |
| Administration | yes | no | yes |

When an Interface has no Experiences, name the Interface directly:

```yaml
availability:
  - interface: release-cli
```

Do not invent a ceremonial Experience for an Interface with only one coherent
context. Conversely, once any Experience uses an Interface, all availability
for that Interface is Experience-scoped; direct and Experience-scoped records
cannot be mixed. Availability is intended Product meaning. It is not inferred
from shared code, routes, packages, or protocols.

## Coverage

`coverage.md` records how broadly the Product Model has been authored and why
known gaps remain:

```md
---
status: partial
method: ["Static inspection without executing target code"]
sourceAreas: [src, server]
unmapped: [deployment]
limitations: ["Runtime-only billing policy was not established"]
---

# Coverage

The mapped scope and why known gaps remain.
```

| Status | Meaning |
| --- | --- |
| `draft` | The model itself is still being authored or reviewed |
| `partial` | Useful model with known unmapped areas |
| `complete` | Intended Product scope is modeled |

`method` describes how the model was created or expanded. `sourceAreas` records
inspected repository areas, `unmapped` names intentionally absent Product
scope, `limitations` states what could not be established, and the lead prose
is the rationale. Coverage has no entity counts or Reference-derived fields;
entity totals belong to the Product Report Counts.

Availability and Coverage do not claim implementation status. Every status may
describe planned, implemented, or mixed behavior, and a complete model may have
no References. `businesslens-verify` checks semantic alignment.

Entity files, config, taxonomy, coverage, and orientation are committed.
The model's `.gitignore` ignores `build/` and `cache/`, which are generated and
never committed. See [References](./references.md) for optional external
artifacts.
