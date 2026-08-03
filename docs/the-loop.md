---
title: The loop
description: Decide intended behavior, build through your own flow, invoke verify once, and let it resolve gaps until aligned or blocked.
section: open-source
group: Get started
order: 6
---

# One loop after every starting door

```text
          approved meaning
ideate ─────────────────────► Product Model
                                  │
                                  ▼
                       injected plan / build flow
                                  │
                                  ▼
                              verify once
                       ┌──────────┼──────────┐
                       │          │          │
                 model change  code change  scoped map
                       │          │          │
                       └──────► re-verify ◄──┘
                                  │
                                  ▼
                      aligned + final lint → merge
```

The build flow in the middle is deliberately yours. It may be plan mode, an SDD
framework, a coding agent, or a team workflow. BusinessLens supplies the product
contract and the verification loop around it.

## Before building: ideate

Use ideate when product meaning changes. It explores only when the direction is
open, drafts the exact Product Model delta, and waits for approval before
writing. The model is intentionally ahead of code during the build phase.

## After building: verify once

You do not choose or invoke follow-up skills. Verify inspects a branch, named
area, or full current state and classifies each gap:

| Finding | Automatic route |
| --- | --- |
| Model is right | Send the approved acceptance packet to the injected builder, then verify again |
| Code is right | Draft the smallest model delta, get approval, write it, then verify again |
| Neither is right | Resolve intended behavior, approve the model, build, then verify again |
| Established area is absent/untrusted | Run a scoped mapping phase, approve it, then verify again |
| Source cannot establish the answer | Stop with an explicit unverifiable blocker |

The user still owns product decisions and authorization to change code. The
routing, internal phases, and return to verification are automatic.

## Branch verification versus current-state verification

- `verify this branch` uses Git changes to choose likely work. It includes
  model and code additions, edits, deletions, staged files, and working-tree
  changes.
- `verify current` or `verify full` inspects present behavior without needing a
  merge base or diff.
- `verify <named scope>` inspects one domain, experience, Screen, feature,
  journey, scenario, or path plus necessary dependencies.

Git is a scope tool, never an authority tool. A model committed on the default
branch can still be the approved plan for code added later.

## What verify may change

The semantic verification phase changes nothing. Resolution may:

- write product meaning only after the user approves an exact delta;
- delegate implementation to a builder injected by the harness, under its own
  repository permissions;
- refresh optional `codeRefs` after alignment as navigation bookkeeping.

BusinessLens analysis phases never execute target code. The injected builder
may run the project's normal checks, but must not edit `.businesslens/`.

After every mutation, verify discards old findings and inspects again. If the
same build-directed gap returns unchanged, it stops instead of looping. It
persists no ledger or receipt.

## Read-only reporting

Invoke `businesslens-verify report only` to prohibit model writes, builder
delegation, and bookmark refresh. You receive the same classified findings and
recommendations with no mutations.

## Where map belongs

Map is outside the daily loop. Use it once for adoption, or deliberately for an
absent/untrusted area or coverage expansion. Use verify to answer “is this still
true?”—whether that question comes after a code change or on an ordinary day.

Verify runs final lint before it finishes, so the user does not need another
invocation to complete the loop. `businesslens lint` remains available as a
fast standalone structural check and CI command; verification is what
establishes alignment for the inspected scope.
