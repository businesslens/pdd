---
title: Overview
description: The .businesslens/ folder models one coherent Product across Actors, Interfaces, Experiences, Capabilities, goals, and constraints.
section: open-source
group: Product model
order: 7
---

# The Product Model

The Product Model is a Git-tracked directory of Markdown describing one
coherent Product promise: who it serves, through which supported interaction
forms, in which usage contexts, what it can do, which goals matter, and what
must remain true.

| Entity | Answers | Lives in |
| --- | --- | --- |
| [Actor](./actors.md) | Who acts, and on which side of the Product boundary | `actors/<id>.md` |
| [Interface](./interfaces.md) | Through which supported interaction form | `interfaces/<id>.md` |
| [Experience](./experiences.md) | In which coherent context | `experiences/<id>.md` |
| [Screen](./screens.md) | What users see and can do in a meaningful visual view | `screens/<id>.md` |
| [Domain](./domains.md) | Which optional organizing area | `domains/<id>.md` |
| [Capability](./capabilities.md) | Which durable Product ability | `capabilities/<id>.md` |
| [Journey](./journeys.md) | Which complete Actor goal | `journeys/<id>/journey.md` |
| [Scenario](./scenarios.md) | Which observable acceptance path | `journeys/<id>/scenarios/<id>.md` |
| [Business Rule](./business-rules.md) | What must remain true | `business-rules/<id>.md` |

`product.md` names the Product. `taxonomies.yaml` defines Scenario kinds.
`config.yaml` records folder schema and SDD roots. `coverage.md` describes model
breadth. `.businesslens/README.md` orients an agent that encounters the model.

## Several Interfaces

Website, mobile application, CLI, and supported API are not Product types. They
are possible Interfaces of one Product. A repository containing all four can
use one model when they serve the same coherent value promise.

Genuinely independent Products use independent `.businesslens/` model roots.
Repository layout does not decide this: packages and deployables may implement
one Product, while one repository may contain several Products.

Interfaces describe supported Product contracts, not every technical surface.
An internal API supporting a website normally stays outside the model. A
partner API becomes an Interface when independent Actors use it and its
behavior matters as Product scope.

## Experience matrix

Interface and Experience are orthogonal and many-to-many. Interface says the
interaction form; Experience says the coherent Actor context. Capabilities,
Journeys, Screens, Scenarios, and Rules can declare exact `availability` pairs:

| Experience | Customer web | Customer mobile | Operator CLI |
| --- | --- | --- | --- |
| Public discovery | yes | yes | no |
| Personal workspace | yes | yes | no |
| Administration | yes | no | yes |

This matrix is intended Product meaning. It is not inferred from shared code,
routes, packages, or protocols.

## Optional concepts

Domains are optional navigation for large Capability collections. Journeys may
cross Domains. Screens are optional meaningful visual views; non-visual
Interfaces need none. Screenshots, prototypes, and other visual artifacts stay
external and may be attached through [References](./references.md).

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
entity totals belong to the Product Report Summary.

Availability and Coverage do not claim implementation status. Every status may
describe planned, implemented, or mixed behavior, and a complete model may have
no References. `businesslens-verify` checks semantic alignment.

## References

Any semantic entity may attach the same [References](./references.md) shape.
Kinds identify artifacts; roles distinguish intent, implementation, and
context. References are optional navigation and supporting material, never
Product truth or proof of model/code agreement.

Entity files, config, taxonomy, coverage, and orientation are committed.
`build/` and `cache/` are generated and gitignored. Use `businesslens lint` for
structure and `businesslens-verify` for implementation alignment.
