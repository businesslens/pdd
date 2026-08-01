---
title: Plan a new product
description: Blank repository — plan the whole product as a draft model, implement it, verify it, and watch the model become evidence-backed truth.
section: open-source
group: Tutorials
order: 10
---

# Plan a new product from scratch

**Goal:** a complete planned product before any code exists — and, once you
build it, an evidence-backed model that grew straight out of the plan.

**Prerequisites:** a fresh Git repository (`git init`), Node.js 20.12+, an
AI harness, and the skills installed (`npx businesslens@latest install`).

## Steps

1. Start the guided planning dialogue:

   ```text
   /businesslens-plan
   ```

   With no model and no code, the skill runs the full product interview: why
   the product exists, who it serves (actors), which surfaces it has
   (experiences), its domains and stable features, the business rules that
   constrain it, which goals matter (journeys), and how each plays out
   observably (scenarios with Trigger, Steps, Decision points, and Outcome).
   It proposes drafts after every answer — you correct rather than dictate.

2. Review what it authored: a complete `.businesslens/` Product Model with **no
   codeRefs** and `coverage.md` at `status: draft`. Validation is green with
   warnings — a draft model is planned, not proven. Iterate by invoking
   `/businesslens-plan` again with corrections, then commit:

   ```bash
   npx businesslens@latest validate
   git add .businesslens
   git commit -m "plan: initial product model (draft)"
   ```

   If nobody ever implements it, this draft model is itself a portable,
   validated product design — plain Markdown you can hand to anyone.

3. Implement with your coding agent, pointing it at the model as the product
   spec:

   ```text
   Implement the product described in .businesslens/ — its features, business
   rules, journeys, decisions, and scenarios are the product contract.
   ```

   Before verification, stage every new or changed implementation file with
   `git add <paths>` (replace `<paths>` with the actual files and review the
   staged diff). BusinessLens never changes the Git index itself, and
   `codeRefs` can cite only paths already returned by `git ls-files`.

4. Verify the implementation against the plan:

   ```text
   /businesslens-sync
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
   git commit -m "feat: verify implementation against the planned model"
   ```

   The commit includes the implementation staged in step 3 and the verified
   model staged here.

## Outcome

A green, evidence-backed model born from the plan. From here the product uses
the same loop as any mapped repository —
[plan and ship a feature](./tutorial-ship-a-feature.md).
