---
title: From an idea
description: You have a domain, not yet a product. Choose a shape, plan it into a Product Model, then build it.
section: open-source
group: Get started
order: 5
---

# Start from an idea

You have a domain, not yet a product. This door decides what to build, plans it
into a Product Model before any code exists, and — once you build it — leaves
you an evidence-backed model that grew straight out of the plan.

**Prerequisites:** a fresh Git repository (`git init`), Node.js 20.12+, an
AI harness, and the skills installed (`npx businesslens@latest install`).

## Steps

1. Start the conversation:

   ```text
   /businesslens-ideate
   ```

   If you have not settled on what to build, it proposes three to five
   genuinely distinct product shapes — who each serves, the one job it does,
   why someone would pick it, and what it deliberately is not — then stops.
   Choosing is yours; it writes nothing until you pick one.

   If you already know what you are building, say so and it goes straight to
   the next step.

2. Once you have chosen, the same conversation runs the full product
   interview: why the product exists, who it serves (actors), which surfaces
   it has (experiences), its domains and stable features, the business rules
   that constrain it, which goals matter (journeys), and how each plays out
   observably (scenarios with Trigger, Steps, Decision points, and Outcome).
   It proposes drafts after every answer — you correct rather than dictate.

   It then shows you the model it intends to write and waits for your
   approval before writing anything.

3. Review what it authored: a complete `.businesslens/` Product Model with **no
   codeRefs** and `coverage.md` at `status: draft`. Validation is green with
   warnings — a draft model is planned, not proven. Iterate by invoking
   `/businesslens-ideate` again with corrections, then commit:

   ```bash
   npx businesslens@latest validate
   git add .businesslens
   git commit -m "model: initial product model (draft)"
   ```

   If nobody ever implements it, this draft model is itself a portable,
   validated product design — plain Markdown you can hand to anyone.

4. Implement with your coding agent, pointing it at the model as the product
   spec:

   ```text
   Implement the product described in .businesslens/ — its features, business
   rules, journeys, decisions, and scenarios are the product contract.
   ```

   Before verification, stage every new or changed implementation file with
   `git add <paths>` (replace `<paths>` with the actual files and review the
   staged diff). BusinessLens never changes the Git index itself, and
   `codeRefs` can cite only paths already returned by `git ls-files`.

5. Reconcile the model with what you built:

   ```text
   /businesslens-sync
   ```

   Every planned addition, change, and removal gets a verdict — met with
   evidence, or a gap with expected-versus-found. Gaps are the remaining
   to-do list; fix and re-run until everything is met. On success the skill
   attaches `codeRefs` to every journey and scenario and moves `coverage.md`
   off `draft`.

6. Validate and commit:

   ```bash
   npx businesslens@latest validate
   git add .businesslens
   git commit -m "feat: implement the planned product model"
   ```

   The commit includes the implementation staged in step 4 and the reconciled
   model staged here.

## Outcome

A green, evidence-backed model born from the plan. From here the product uses
the same loop as any mapped repository —
the loop in [Find your flow](./flows.md).
