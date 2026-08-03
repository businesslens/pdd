---
title: Overview
description: The .businesslens/ folder holds durable intended product behavior, model-breadth context, and optional navigation into code.
section: open-source
group: Product model
order: 7
---

# The Product Model

The Product Model is a Git-tracked directory of Markdown describing intended
product behavior: who it serves, where capabilities are exposed, which goals
matter, how they play out observably, and which rules remain true.

| Entity | Answers | Lives in |
| --- | --- | --- |
| [Actor](./actors.md) | Who | `actors/<id>.md` |
| [Experience](./experiences.md) | Which product surface | `experiences/<id>.md` |
| [Screen](./screens.md) | What users see and can do there | `screens/<id>.md` |
| [Domain](./domains.md) | Which area | `domains/<id>.md` |
| [Feature](./features.md) | Which durable capability | `features/<id>.md` |
| [Journey](./journeys.md) | Which complete goal | `journeys/<id>/journey.md` |
| [Scenario](./scenarios.md) | Which observable path | `journeys/<id>/scenarios/<id>.md` |
| [Business rule](./business-rules.md) | What must remain true | `business-rules/<id>.md` |

`product.md` names and describes the Product Model. `taxonomies.yaml` defines
scenario kinds. `config.yaml` records folder schema and SDD roots.
`coverage.md` describes model breadth. `.businesslens/README.md` orients any
agent that encounters the model.

Screens are optional. They model stable user-visible views for products that
need them without forcing visual concepts into CLI, API, or other non-visual
products.

## Coverage is model breadth

| Status | Meaning |
| --- | --- |
| `draft` | The model itself is still being authored or reviewed |
| `partial` | Useful model with known unmapped areas |
| `complete` | Intended product scope is modeled |

Coverage is independent of implementation. Planned and existing behavior can
coexist in a complete model.

## Code references are optional navigation

Any entity may contain `codeRefs`, but none requires them. They point readers at
tracked source and are removed when a Blueprint crosses repository boundaries.
They do not prove model/code agreement.

## Authored versus generated

Entity files, config, taxonomy, coverage, and orientation are committed.
`build/` and `cache/` are generated and gitignored.

Use `businesslens lint` for deterministic structural checks and
`businesslens-verify` for semantic alignment. See
[Code refs and coverage](./code-refs-and-coverage.md) and
[Conventions](./conventions.md).
