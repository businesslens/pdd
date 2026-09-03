---
title: Introduction
description: BusinessLens brings Product-Driven Development to coding agents through a Git-tracked Product Model and an automatic verification loop.
section: open-source
group: Get started
order: 1
---

# BusinessLens: Product-Driven Development for coding agents

BusinessLens is Product-Driven Development for coding agents. It stores the
durable Product contract in `.businesslens/`: Entities — the ones that act
included — and Interfaces, optional Experiences, Screens, and Domains, followed
by Capabilities, Business Rules, local Capability Scenarios, optional
multi-Capability Journeys, and their end-to-end Journey Scenarios.

The Product Model says what the product is intended to do. It does not prescribe
the stack or replace your plan mode, SDD framework, coding agent, or tests.

## Three ways in

| Starting point | Use |
| --- | --- |
| Existing repository, no trusted model | `businesslens-map` |
| Blank idea or desired behavior change | `businesslens-ideate` |
| Reviewed reusable starting point | `businesslens blueprint pull <name>` |

All three create the same artifact. After that, changes use one loop:

```text
ideate → your plan/build flow → verify (including final lint) → merge
```

See the [development loop](./the-loop.md) for the everyday workflow and the
[`verify` skill](./skill-businesslens-verify.md) for inspection and resolution
modes.

## Two checks

- `businesslens lint` is deterministic structure: files, fields, availability, relationships,
  grammar, and tracked code-reference paths.
- `businesslens-verify` is semantic inspection: whether current code supports
  the model's observable contract.

A green lint result never claims model/code agreement.

## Coverage and evidence

[Coverage](./product-model.md#coverage) describes how much intended Product
breadth is modeled. [References](./references.md) attach optional external
material. Neither claims implementation alignment.

Choose your starting door: [from your repo](./from-your-repo.md),
[from a Blueprint](./from-a-blueprint.md), or [from an idea](./from-an-idea.md).
Then follow the [development loop](./the-loop.md).
