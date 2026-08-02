---
title: Your commit loop
description: Which commits need a model edit and which do not, whether to plan first or record after, and the mistakes worth avoiding.
section: open-source
group: Integration
order: 20
---

# Your commit loop

BusinessLens is not meant to be a tax on every commit. **Most commits do not
touch the model at all.**

## Does this change need a model edit?

One test: **if a user could notice the difference and describe it without
mentioning code, the model changes. Otherwise it does not.**

| Change | Model edit? |
| --- | --- |
| New capability, changed rule, new surface, retired journey | **Yes** — `/businesslens-ideate` |
| A bug fix where the documented behavior was itself wrong | **Yes** — `/businesslens-ideate` |
| Refactor, rename, file move, perf work, dependency bump | No — only `codeRefs` go stale |
| A bug fix restoring behavior the model already describes | No — the model was already right |

Most commits are in the bottom half. There, behavior did not move, so the model
is still true and only its evidence is out of date: `npx businesslens validate`
catches the stale `codeRefs` and `/businesslens-sync` repairs them.

## Plan first, or record after?

The default is **ideate before you build**, because the scenarios you write
become the acceptance criteria your coding agent is held to and `sync` checks
against afterward. That is the payoff, and it is why the docs lead with it.

But you can always skip it. Build first, then run `sync` — it reads the diff,
works out what the code became, and brings you the model edit one decision at a
time. Nothing breaks and no state is invalid.

The honest tradeoff is **per change, not per team**:

- **Ideate-first is faster for anything non-obvious**, because otherwise `sync`
  has to infer your intent from a diff and will ask you more questions.
- **Sync-first is faster for small or obvious changes.**

Changing the code without planning first is a legitimate way to work.

## What a branch looks like

```text
1. /businesslens-ideate <what you want>
       → propose, approve, write the model edit
2. commit the model edit on its own
       → this is the reviewable product delta
3. implement
4. /businesslens-sync
       → verdict per planned scenario, evidence attached
5. validate green → merge
```

Git is the change model throughout: **a plan is a branch**, **review is the pull
request**, **done is validation green**, and **the archive is git history**.
There are no status fields and no lifecycle to maintain.

On the branch, `validate` reporting `needs at least one codeRef` on the journeys
and scenarios you just planned is **not a problem** — it is the evidence
checklist. `businesslens-sync` clears it at step 4.

## Things to avoid

- **Leaving the model edit uncommitted while you build.** Commit it on its own.
  A reviewable product delta is the entire safety property, and it disappears
  the moment it is mixed into a working tree full of implementation.
- **Ideating a refactor.** See the test above — if no user can notice it, the
  model does not change.
- **Ideating against unmapped code.** Run `businesslens-init` first. Planning
  against code nobody has read produces a model that contradicts reality on day
  one.
- **Hand-editing `.businesslens/` and skipping `validate`.** Every skill runs it
  for you; type it yourself when you edited by hand.
- **Treating plan-mode output as the spec.** It dies with the conversation. See
  [With plan mode](./with-plan-mode.md).

## You rarely type `validate` yourself

Every skill runs it. `blueprint export` and `blueprint contribute` run it before
they produce anything, and [CI](./ci.md) runs it on every pull request.

Type it when you edited `.businesslens/` by hand, when you want the drift
picture, or to reproduce a CI failure locally.
[Full breakdown](./cli-validate.md#when-it-runs-itself).
