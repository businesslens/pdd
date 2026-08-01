---
title: plan
description: Plan a product or feature directly in the model before implementation — guided greenfield definition or quick/thorough feature planning.
section: open-source
group: Skills
order: 16
---

# `businesslens-plan`

Plans product behavior by editing the model itself: describe the intended
actors, capabilities, business rules, journeys, scenarios, intent, and
decision points before (or instead of) writing code. Git is the change
model — the branch holds the plan, and validation's
`needs at least one codeRef` findings on the planned entities are the
evidence checklist for new journeys and scenarios. The model diff remains the
complete plan, including changes and removals.

## When to use it

- A **blank repository**: it runs the full guided product interview and
  authors the whole product as a draft model (`coverage: draft`).
- A **mapped repository**: it edits the model on your branch to the intended
  state for a new feature.
- A **design deliverable**: a draft model nobody implements yet is a
  validated, portable product spec.
- A repository with code but no model gets routed to
  [`businesslens-init`](./skill-businesslens-init.md) first — it never
  plans against unmapped code.

## Invocation

```text
/businesslens-plan add guest checkout to the storefront
/businesslens-plan quick: add dark mode
/businesslens-plan thorough: rethink the onboarding flow
```

`quick` asks at most a few batched questions and drafts the rest from model
context; `thorough` runs the full interview (why, who, surfaces, features,
rules, journeys, scenario and decision space, removals, done-when). Without
a keyword it infers the depth from the ask.

## What it reads and writes

Reads the existing model and repository material. Writes model entity files to
their desired state (new files carry **no** codeRefs — planned behavior has
no evidence yet), new scenario kinds in `taxonomies.yaml`, and on
greenfield the minimal scaffold (`config.yaml`, `taxonomies.yaml`,
`product.md`, `coverage.md` at `status: draft`, `.gitignore`).

## How it works

Interview → author → validate. It proposes concrete drafts you correct
rather than interrogating from a blank page, keeps prose at product
altitude, and ends with only expected missing-evidence findings on newly
unevidenced journeys and scenarios. Implement, then run
[`businesslens-verify`](./skill-businesslens-verify.md).

## Guardrails

- Never invents implementation detail — no stacks, endpoints, schemas, or
  file names in entity prose.
- Never adds a codeRef for behavior that does not exist.
- Never weakens evidenced current truth except where the plan deliberately
  retires it.
- Never implements, executes target code, or submits the Product Model.

Tutorials: [Plan a new product](./tutorial-plan-new-product.md) ·
[Ship a feature](./tutorial-ship-a-feature.md).
