---
title: sync
description: Repair the model after code changed without a plan — targeted drift recovery, not the routine loop.
section: open-source
group: Skills
order: 19
---

# businesslens-sync

Recovers model truth after **unplanned** code changes — a hotfix, a refactor
that moved evidence, a feature that skipped planning. The primary loop is
plan → implement → verify; sync is the repair lane for everything that
bypassed it, and it updates only the product truth the changes actually
affected.

## When to use it

- The model drifted: `validate` reports stale `codeRefs`, or the code does
  something the model does not say.
- After merging work that never went through
  [`businesslens-plan`](./skill-businesslens-plan.md).
- Not after planned work — run
  [`businesslens-verify`](./skill-businesslens-verify.md) there instead.

## Invocation

```text
/businesslens-sync
/businesslens-sync for the changes in the last three commits
```

## What it reads and writes

Reads the change range — explicit user context first, otherwise the working
tree, staged diff, and recent commits — and the affected implementation.
Writes only affected entities: revised feature, rule, journey, scenario,
intent, decision, and evidence content; the smallest justified new entities;
deleted obsolete ones; repaired `codeRefs`; and `coverage.md` when the
inspected surface materially changed.

## How it works

It establishes a validation baseline (pre-existing errors are reported, not
concealed), maps changed files to existing entity `codeRefs`, inspects new
surfaces that may expose unreferenced behavior, applies the smallest
targeted updates, checks reverse relationships after every structural edit,
and validates until green.

## Guardrails

- Never rewrites the whole model when a targeted update suffices.
- Never copies prescriptive SDD text into the descriptive model.
- Never executes target code or submits the Product Model.

Tutorial: [Recover from drift](./tutorial-recover-from-drift.md).
