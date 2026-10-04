---
title: map
description: Create or expand a Product Model from the code you already have, without running it.
section: open-source
group: Skills
order: 17
---

# `businesslens-map`

**Map reads your repository and writes a Product Model of what the product
already does.**

Use it once, when you adopt BusinessLens in a repository that has code, and
again only for an area the model doesn't cover yet or that you no longer trust.
It is not a daily step: to check that the model is still current, use
[`businesslens-verify`](./skill-businesslens-verify.md).

```text
/businesslens-map
/businesslens-map billing
```

The first maps the whole repository; the second maps one area and what it
needs.

## What you get

1. **Numbered questions, each with a recommendation.** The code says what
   happens, not what the product means, so map asks what inspection can't
   settle: which surfaces are supported [Interfaces](./interfaces.md), whether a
   family of things is one [Entity](./entities.md) or several, where a Scenario
   ends and an edge case begins, and the product's own name for each thing. It
   asks in rounds and waits for your answers.
2. **The proposed change.** Every resource it would add, change or remove, what
   it left unmapped, and what it couldn't establish, before anything is written.
3. **Files written after you approve**, only inside `.businesslens/`. A first
   run creates the whole folder, including the model's README
   (`.businesslens/README.md`).
4. **Lint**, fixed until clean.
5. **A report**: what is mapped, what is not, the limitations, and the lint
   result.

## How it reads the code

Map starts at the entry points (routes, commands, handlers) and follows each
one through to what it stores and what the person sees. Tests and docs are
leads; it confirms every claim in the implementation. Then it sweeps four times:

| Sweep | Looks for | Becomes |
| --- | --- | --- |
| Verbs | What people and systems can do | [Capabilities](./capabilities.md), each with Scenarios for its cases |
| Nouns | Each thing the product keeps | Its States, the Steps that move it between them, and the [Screens](./interfaces.md#screens) that show it |
| Permissions | Every authorization check: a role, an owner, a threshold | A grant on a [Business Rule](./business-rules.md); an operation refused to everyone is `permits: []` |
| Hand-offs | Places where the product carries a person from one Capability into the next | A [Journey](./journeys.md) |

A state nothing moves a thing into, or a thing nothing changes, becomes a
question for you, never a guess.

Flags, settings, plans and A/B tests are classified by
[What selects](./variations.md#what-selects-decides-it): a
[Variation](./variations.md) only when they switch between complete supported
forms; otherwise a condition, a separate Scenario, or a condition on who may.

Map attaches what it actually read as [References](./references.md) (the code
it traced, and any PRD or spec that states the behavior) as a record of where a
claim came from, not proof. In a repository using a spec-driven tool, it records
those folders in `config.yaml`.

## Related

- [`businesslens-ideate`](./skill-businesslens-ideate.md): decide what should
  change next.
- [`businesslens-verify`](./skill-businesslens-verify.md): check the model and
  code still agree.
- [Start from your repository](./from-your-repo.md)
