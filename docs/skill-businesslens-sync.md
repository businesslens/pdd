---
title: sync
description: Reconcile the Product Model with the code — attach evidence where they already agree, and settle everything else one decision at a time.
section: open-source
group: Skills
order: 13
---

# `businesslens-sync`

Makes the model and the code agree, in whichever direction the situation calls
for. One rule decides what it may do on its own:

> **Evidence is safe. Meaning is yours to confirm.**

- **Proof** — the code already does what the model says, and only `codeRefs`
  change. Nothing about the product moved, only the evidence for it. It
  attaches that and reports it.
- **Everything else** — the model would have to say something different, or the
  code would. That is a product decision, and it comes to you.

It never edits implementation code. When the answer is "the code is wrong", it
records the decision and says so.

## When to use it

Any time the code has moved. You do not have to work out whether you planned
first — it reads that from git:

| What happened | What sync does |
| --- | --- |
| You planned a change, then built it | Checks the code against the plan, including deletions |
| You changed the code without planning | Works out what the code became |
| You only planned; nothing built yet | Says so and stops |
| Nothing changed | Asks what you expected, rather than rewriting anything |

This is the same four-row split
[`businesslens validate`](./cli-validate.md) reports, and
[Find your flow](./flows.md) explains.

## Invocation

```text
/businesslens-sync
/businesslens-sync for the changes in the last three commits
```

## What it reads and writes

Reads `businesslens validate --json` for the current state, the model diff
against the merge base when a plan exists, the change range otherwise, and the
implementation behind both. Writes only model files: `codeRefs`, confirmed
prose changes, and `coverage.md`. Never implementation code, and never the Git
index — if evidence depends on an untracked file, that is a decision for you,
not something it stages on your behalf.

## How the decisions reach you

The queue is sorted before anything is asked, because later questions often
disappear once an earlier one is answered:

1. **Blocking** — anything stopping the model from loading or validating.
2. **Dependency order** — a journey's existence before its scenarios, a
   business rule before the scenarios that would cite it.
3. **Product impact** — observable behavior before internal organization.
4. **Everything else** — coverage prose, limitations, hygiene.

Then it asks **one question at a time and waits.** Each one carries what it
found with the exact files, what would have to change, its recommendation and
why, and which other queued items your answer will settle.

After every answer it re-runs validation and rebuilds the queue — an answer can
resolve later questions, create new ones, or change the right order for what is
left. It repeats until the queue is empty.

## Guardrails

- Never modifies implementation code.
- Never executes target repository code.
- Never rounds a partial implementation up to proof, and never treats a
  similarly named function or route as evidence. "I could not establish this
  from source" is a real answer.
- Never resolves a decision on your behalf because the answer seems obvious.
- Never silently overwrites a plan with whatever the code currently does.
- Never copies prescriptive SDD text into the descriptive model.
- Never submits or contributes the Product Model.

Every situation it covers: [Find your flow](./flows.md).
