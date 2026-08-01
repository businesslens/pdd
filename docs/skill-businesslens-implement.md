---
title: businesslens-implement
description: Build the software a Product Model describes, treating its scenarios as the acceptance contract.
section: open-source
group: Skills
order: 18
---

# `businesslens-implement`

Takes a Product Model with no implementation and builds the product it
describes. This is the second half of the catalog's promise: `pull` gives you a
complete specification, `implement` turns it into working software.

## When to use it

- After [`businesslens pull`](./cli-pull.md) brings a Blueprint into an empty
  directory.
- After `businesslens-plan` has planned a new product that has not been built.

If substantial code already exists, the skill stops and directs you to
`businesslens-init` to map today's truth first. Implementing over unmapped code
produces a model that describes neither what was there nor what you added.

## What it does

Reads the whole model first — it is small by construction — then derives the
work from its structure rather than from assumptions about the domain:

| Model | Becomes |
| --- | --- |
| Experiences | Surfaces, with `access` and `entryPoints` as real routes |
| Actors | The roles authorization is expressed in |
| Features | Capabilities |
| Business rules | Invariants, enforced in one place each |
| Journeys and scenarios | The behavior, and the tests |

It works in journey order, writing a test per scenario. A scenario already
carries a Trigger, ordered Steps, optional Decision points, and an Outcome —
that is a test case, and naming each test after its scenario id keeps the
mapping visible.

## The stack

The model prescribes none, deliberately. The skill chooses one, says which and
why, and stays consistent. A Blueprint that named a framework would be less
useful to everyone who wanted a different one.

## Guardrails

- **Never weaken the model to match the code.** If a scenario is wrong or
  impossible, that is reported, not silently implemented differently.
- **Never add behavior the model does not describe.** Unrequested behavior is
  unverifiable, and the model stops being the source of truth the moment the
  code exceeds it.
- Evidence is `businesslens-verify`'s job; `implement` does not write `codeRefs`.

## Afterwards

Run [`businesslens-verify`](./skill-businesslens-verify.md) to attach evidence
and move coverage off `draft`, then `npx businesslens validate`.
