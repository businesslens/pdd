---
title: Ship a feature
description: The feature loop — describe intended behavior in the map, implement, verify with evidence, merge green.
section: open-source
group: Tutorials
order: 9
---

# Plan and ship a feature

**Goal:** ship a feature so the plan, the implementation check, and the
updated map are all reviewable in one branch — with git as the change
model.

**Prerequisites:** a repository with a green `.businesslens/` map (see
[Map an existing product](./tutorial-map-existing-product.md)) and the
skills installed.

## Steps

1. On a feature branch, plan in the map:

   ```text
   /businesslens-plan add guest checkout to the storefront
   ```

   The skill reads the affected map areas and edits them to the intended
   state — new or revised journeys and scenarios, updated experiences,
   retired entities removed. Say `quick` for minimal questions or
   `thorough` for the full interview. Planned behavior gets **no**
   codeRefs; after planning, `validate` lists new unevidenced journeys and
   scenarios as `needs at least one codeRef`. Those findings are the evidence
   checklist and stay red on purpose; the full map diff also records changed
   and retired entities for verification.

2. Commit the plan. This is the moment to agree on *what* before the how:

   ```bash
   git add .businesslens
   git commit -m "plan: guest checkout"
   ```

   The map diff in the pull request shows reviewers the product delta in
   plain Markdown.

3. Implement with your coding agent, using the planned journeys and
   scenarios as the behavior contract (and your SDD tool for the technical
   design — link it from the map with `links: rel: spec`).

   Before verification, stage every new or changed implementation file with
   `git add <paths>` (replace `<paths>` with the actual files and review the
   staged diff). BusinessLens never changes the index, and `codeRefs` can cite
   only paths already returned by `git ls-files`.

4. Verify:

   ```text
   /businesslens-verify
   ```

   The skill diffs the map against the merge base, checks every planned
   addition, change, and removal against the code, attaches `codeRefs` for
   what's met, and reports gaps as expected-versus-found. If you changed the
   plan while implementing, just re-run — the diff recomputes. Fix gaps and
   repeat until verification is complete:

   ```bash
   npx businesslens@latest validate
   git add .businesslens
   git commit -m "feat: guest checkout, verified against the map"
   ```

   The commit includes the implementation staged in step 3 and the verified
   map staged here.

5. Open the pull request. CI validation gates it (see
   [Validate in CI](./ci.md)); merging green means the map and the code
   agree.

## Outcome

The map describes the new behavior with evidence, the branch history
records what was planned versus what shipped, and nothing about the
workflow existed outside git.
