---
title: Introduction
description: BusinessLens keeps intended product behavior durable, gives every repository three starting doors, and verifies changes through one automatic loop.
section: open-source
group: Get started
order: 1
---

# Product context that survives the session

BusinessLens is Product-Driven Development for coding agents. It stores the
durable Product contract in `.businesslens/`: Actors, Interfaces, Experiences,
optional Screens and Domains, Capabilities, Rules, Journeys, and observable
Scenarios.

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

`verify` is one invocation, not a checklist of skills. It inspects the requested
scope, negotiates only real authority decisions, automatically runs narrow
intent-resolution or mapping phases when needed, delegates implementation to the
builder injected by your harness, and checks again until aligned or blocked.
Its final report includes the structural lint result.

## Two checks

- `businesslens lint` is deterministic structure: files, fields, availability, relationships,
  grammar, and tracked code-reference paths.
- `businesslens-verify` is semantic inspection: whether current code supports
  the model's observable contract.

A green lint result never claims model/code agreement.

## Context and scope

[References](./references.md) optionally attach intent, implementation, or
context artifacts to an entity. They do not prove alignment or carry lifecycle
state.
Coverage describes only how much intended Product scope is modeled; a complete
model can have no References.

Choose your starting door: [from your repo](./from-your-repo.md),
[from a Blueprint](./from-a-blueprint.md), or [from an idea](./from-an-idea.md).
Then read [the loop](./the-loop.md).
