---
title: How it works
description: The framework guide — one artifact, git as the change model, and which skill to use when.
section: open-source
group: Concepts
order: 4
---

# How BusinessLens works

BusinessLens keeps exactly one artifact: the product map. Everything else is
a workflow around it.

## The map and its rule

The map describes the product — actors, experiences, domains, journeys,
scenarios. Its one rule: **behavioral claims need evidence.** Every journey
and scenario must cite tracked code (`codeRefs`), and `validate` checks
every path against `git ls-files`. On your default branch the map is always
green: evidence-backed truth.

## Git is the change model

Planning does not need its own folder, lifecycle, or status fields — git
already has all three:

- **A plan is a branch** where the map describes intended behavior. New
  journeys and scenarios have no `codeRefs` yet, so `validate` lists them as
  errors — the evidence checklist, not a problem to suppress. The map diff
  remains the complete plan, including changed and deleted entities.
- **Review is the pull request.** The map diff shows the product delta;
  reviewers approve behavior before or alongside code.
- **Done is verification complete and validation green.**
  `businesslens-verify` checks every planned addition, change, and removal;
  scenario Trigger, Steps, and Outcome are the behavioral acceptance
  contract. It attaches evidence to what exists and reports every verdict.
- **The archive is git history.**

The one special state is a brand-new product with no code at all:
`coverage.md` `status: draft` marks the whole map as planned, downgrading
missing evidence to warnings so the draft validates green. `build` and
`publish` refuse draft maps; a fully successful verify moves coverage off
draft, and evidence is strictly required from then on.

## The loop

```text
map exists?  no + code    → /businesslens-init      (evidence-backed map)
             no + blank   → /businesslens-plan      (guided interview → draft map)

every feature:
  /businesslens-plan …    edit the map to the intended behavior
  implement               your coding agent + your SDD tool
  /businesslens-verify    evidence attached, gaps reported
  validate green          merge; CI gates the PR

map drifted (unplanned change)? → /businesslens-sync
```

## Which skill, when

| Situation | Skill |
| --- | --- |
| Existing code, no map yet | `businesslens-init` |
| Blank repository, new product | `businesslens-plan` |
| New feature or product decision, before code | `businesslens-plan` (quick or thorough) |
| A design deliverable nobody will implement yet | `businesslens-plan` (the draft map is the deliverable) |
| Planned behavior implemented, needs checking | `businesslens-verify` |
| Code changed without a plan | `businesslens-sync` |
| One journey or experience needs exhaustive depth | `businesslens-deep-dive` |
| Deterministic check, CI readiness | `businesslens-validate` |
| Something looks wrong, stale, or stuck | `businesslens-doctor` |
| Publish a snapshot to the platform | `businesslens-publish` |

## Scenarios are the acceptance criteria

There is no separate acceptance-criteria artifact: a scenario's Trigger,
ordered Steps, and Outcome are already an observable, checkable contract.
Write them so a reviewer could check them against source code without
executing anything — "submitting an empty cart shows an error and keeps the
cart", not "cart validation works". `businesslens-verify` verifies exactly
that, statically, and never marks a scenario met without direct evidence.

## Where publishing fits

`build` compiles the map into a portable document; `publish` submits it as a
commit-pinned snapshot. Both run from CI on the default branch (see
[Validate in CI](./ci.md)) and both refuse draft maps — nothing
unimplemented ever publishes.
