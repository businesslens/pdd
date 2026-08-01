---
title: ideate
description: Propose candidate product directions, as a shortlist to choose from. The only skill that never writes.
section: open-source
group: Skills
order: 16
---

# `businesslens-ideate`

Divergent, and the only BusinessLens skill that writes nothing. Ideation
proposes; a person chooses; `businesslens-plan` writes.

## When to use it

- **On an empty repository** — when you know roughly the domain but not the
  product. It proposes distinct product shapes: who each serves, the one job it
  does, why someone would choose it, and what it deliberately is not.
- **On an existing model** — when you are deciding what to build next. It reads
  what is there and proposes what is missing.

## What it looks for in an existing model

The gaps the structure makes visible, rather than features that happen to come
to mind:

- actors with thin or no experiences;
- journeys whose scenarios cover only the primary path, with no permission,
  validation, conflict, or external-failure case;
- business rules with no covering scenario, and scenarios enforcing something no
  rule states;
- features reachable from no journey;
- domains the product implies but never covers;
- limitations in `product.md` that have quietly stopped being true.

Candidates are ranked by what they would change for a user, not by effort, and
each names what it would cost elsewhere in the model — the rule it complicates,
the journey it lengthens, the actor it introduces. An idea with no stated cost
has usually not been thought through.

## Why it never writes

A Product Model holds what the product **does**, not what it might. A proposal
written into `.businesslens/` would be indistinguishable from a decision someone
made, and the model would stop being trustworthy as a description of the
product.

This is also why the skill will not proceed to planning on its own initiative.
The handoff is yours.

## The split

| Skill | Produces |
| --- | --- |
| `businesslens-ideate` | A shortlist. Writes nothing. |
| [`businesslens-plan`](./skill-businesslens-plan.md) | Entities in the model. |
