---
title: Plan a new product
description: Blank repository — plan the whole product as a draft map, implement it, verify it, and watch the map become evidence-backed truth.
section: open-source
group: Tutorials
order: 8
---

# Plan a new product from scratch

**Goal:** a complete planned product before any code exists — and, once you
build it, an evidence-backed map that grew straight out of the plan.

**Prerequisites:** a fresh Git repository (`git init`), Node.js 20.12+, an
AI harness, and the skills installed (`npx businesslens@latest install`).

## Steps

1. Start the guided planning dialogue:

   ```text
   /businesslens-plan
   ```

   With no map and no code, the skill runs the full product interview: why
   the product exists, who it serves (actors), which surfaces it has
   (experiences), which goals matter (journeys), and how each plays out
   observably (scenarios with Trigger, Steps, Outcome). It proposes drafts
   after every answer — you correct rather than dictate.

2. Review what it authored: a complete `.businesslens/` map with **no
   codeRefs** and `coverage.md` at `status: draft`. Validation is green with
   warnings — a draft map is planned, not proven. Iterate by invoking
   `/businesslens-plan` again with corrections, then commit:

   ```bash
   npx businesslens@latest validate
   git add .businesslens AGENTS.md
   git commit -m "plan: initial product map (draft)"
   ```

   If nobody ever implements it, this draft map is itself a portable,
   validated product design — plain Markdown you can hand to anyone.

3. Implement with your coding agent, pointing it at the map as the product
   spec:

   ```text
   Implement the product described in .businesslens/ — the journeys and
   scenarios are the behavior contract.
   ```

   Before verification, stage every new or changed implementation file with
   `git add <paths>` (replace `<paths>` with the actual files and review the
   staged diff). BusinessLens never changes the Git index itself, and
   `codeRefs` can cite only paths already returned by `git ls-files`.

4. Verify the implementation against the plan:

   ```text
   /businesslens-verify
   ```

   Every planned addition, change, and removal gets a verdict — met with
   evidence, or a gap with expected-versus-found. Gaps are the remaining
   to-do list; fix and re-run until everything is met. On success the skill
   attaches `codeRefs` to every journey and scenario and moves `coverage.md`
   off `draft`.

5. Validate and commit:

   ```bash
   npx businesslens@latest validate
   git add .businesslens
   git commit -m "feat: verify implementation against the planned map"
   ```

   The commit includes the implementation staged in step 3 and the verified
   map staged here.

## Outcome

A green, evidence-backed map born from the plan. From here the product uses
the same loop as any mapped repository —
[plan and ship a feature](./tutorial-ship-a-feature.md).
