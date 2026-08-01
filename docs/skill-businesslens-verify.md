---
title: verify
description: Statically verify the implementation delivers the planned model changes — evidence attached, gaps reported honestly.
section: open-source
group: Skills
order: 17
---

# `businesslens-verify`

Closes the gap between what the model claims and what the code proves. It
derives the planned delta fresh on every run — the model diff against your
merge base, plus every journey and scenario still lacking `codeRefs` — so
the plan can keep evolving while you implement.

## When to use it

- After implementing behavior that was planned in the model with
  [`businesslens-plan`](./skill-businesslens-plan.md), before merging.
- To finish a greenfield draft model: a fully verified product moves
  `coverage.md` off `draft`.
- Not for unplanned drift — that is
  [`businesslens-sync`](./skill-businesslens-sync.md)'s direction.

## Invocation

```text
/businesslens-verify
/businesslens-verify against origin/main
```

Without a base it uses the merge base with the default branch; with no base
at all (fresh greenfield repo) it treats the whole model as planned.

## What it reads and writes

Reads the model diff and the implementation. Writes only model files:
`codeRefs` on met scenarios and journeys (preferring `path#symbol`),
user-confirmed prose corrections where the implementation deliberately
diverged, repaired stale refs, and the coverage update on a completed
greenfield. The met/gap report goes to the conversation — it pastes well
into a PR description. It never stages files; new implementation paths must
already be staged or committed before they can be used as evidence.

## How it works

Each planned scenario's Trigger, Steps, and Outcome is the acceptance
contract. The skill also verifies deleted behavior is absent and checks
changed access, entry points, capability boundaries, and relationships on
higher-level entities. It records **met**, **gap**, or **unverifiable** for
implementation-bearing work and explicitly classifies product-only work as
**model-only**, then runs the validator through its bundled isolated runner.
Completion requires all implementation-bearing work to be met, all model-only
work to be classified, coverage to be off `draft`, no validation errors, and
no missing-evidence warnings; a draft model's zero exit status alone is not
completion.

## Guardrails

- Never marks a scenario met without direct evidence; tests corroborate but
  documentation alone proves nothing.
- Never deletes or waters down planned claims to force validation green.
- Never modifies implementation code, never executes target code, never
  submits the Product Model.

Tutorial: [Ship a feature](./tutorial-ship-a-feature.md).
