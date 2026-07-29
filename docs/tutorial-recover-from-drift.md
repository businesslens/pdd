---
title: Recover from drift
description: Make the model true again after unplanned changes — sync, doctor, and getting back to the loop.
section: open-source
group: Tutorials
order: 11
---

# Recover when code changed without a plan

**Goal:** the model matches reality again after code changed outside the
plan → implement → verify loop — a hotfix, a refactor that moved evidence,
or a feature that skipped planning.

**Prerequisites:** a repository with an existing `.businesslens/` Product Model.

## Steps

1. Detect the drift:

   ```bash
   npx businesslens@latest validate
   ```

   Broken `codeRefs` and structural errors surface here. For semantic drift
   (the code does something the model does not say), run:

   ```text
   /businesslens-doctor
   ```

   Doctor classifies findings — blocking, drift, coverage, hygiene — and
   proposes an ordered repair plan without changing files.

2. Repair the model:

   ```text
   /businesslens-sync
   ```

   Sync scopes the drift from the diff and updates only affected entities:
   revised prose and evidence, the smallest justified new entities, deleted
   obsolete ones, repaired `codeRefs`.

3. Validate and commit:

   ```bash
   npx businesslens@latest validate
   git add .businesslens
   git commit -m "docs: resync product model"
   ```

4. Return to the loop. Drift means work bypassed planning; the durable fix
   is upstream — describe the next feature in the model first
   (`/businesslens-plan`) and let CI validation catch the model going stale.

## Outcome

A green, truthful model — and a clear boundary: sync is the recovery lane,
not the routine. Planned work goes through
[the feature loop](./tutorial-ship-a-feature.md).
