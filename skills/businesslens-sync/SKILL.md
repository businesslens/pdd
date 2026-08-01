---
name: businesslens-sync
description: Reconcile the .businesslens/ Product Model with the code — attach evidence where the code already does what the model says, and resolve everything else with the user one decision at a time. Use after implementing a planned change, after changing code without planning first, or whenever the model may have drifted from the implementation.
---

# Sync the model with the code

Make the model and the code agree, in whichever direction the situation calls
for. One rule decides what you may do on your own:

> **Evidence is safe. Meaning is yours to confirm.**

- **Proof** — the code already does what the model says, and only `codeRefs`
  change. Nothing about the product moved, only the evidence for it. Attach it
  and report it.
- **Everything else** — the model would have to say something different, or the
  code would. That is a product decision. Put it to the user.

Never edit implementation code. When the answer is "the code is wrong", record
the decision and say so; changing it is the user's job.

Read [references/format.md](references/format.md) and
[references/evidence-policy.md](references/evidence-policy.md) before editing.

## Workflow

### 1. Establish the state

Require an existing `.businesslens/` Product Model. If it is absent, stop and
direct the user to `businesslens-init`.

Run `npx businesslens validate --json`. Record pre-existing errors separately
from anything this change introduced — never conceal unrelated problems, and
never take credit for fixing them silently.

Read `branch.situation`. It tells you what the user did, so they do not have to:

| `situation` | What happened | What that means here |
| --- | --- | --- |
| `implemented` | the model and the code both changed | a **plan exists** — check the code against it |
| `unplanned-code` | only the code changed | **no plan** — work out what the code became |
| `planned` | only the model changed | nothing is built yet; say so and stop |
| `at-rest` | nothing changed | ask what they expected; do not rewrite the model for no reason |
| absent | no merge base (shallow clone, no commits) | ask which changes to reconcile against |

Never override `situation` on your own judgment — it is derived from git, not
inferred. A user may override it explicitly; say what you are overriding.

### 2. Build the worklist

**A plan exists.** The plan is the authority and the code must match it. Derive
the worklist fresh on every run — never reuse an earlier report:

- every authored model file added, modified, **or deleted** in
  `git diff <base>...HEAD -- .businesslens/`, plus uncommitted model edits;
  retain the base version of a deleted entity as the removal contract;
- plus every journey and scenario lacking `codeRefs`.

**No plan.** The code is the authority and the model must catch up. Take the
change range from explicit user context first; otherwise inspect the working
tree, staged diff, and recent commits. Map changed files onto existing
`codeRefs`, then inspect new routes, commands, handlers, services, persistence,
configuration, and tests for behavior nothing references yet.

### 3. Classify every item

Exactly one of:

- **proof** — the observable behavior the model already describes is present in
  the code. Nothing the model *says* needs to change.
- **decision** — anything else: the model describes behavior the code does not
  have, the code has behavior the model does not describe, the two describe it
  differently, or you cannot tell from source alone.

Do not round a partial implementation up to proof. Do not treat a
similarly-named function, route, or flag as proof of a scenario. Trace the
whole path — entry point → handler or service → persistence or external effect
→ the outcome the scenario names.

### 4. Apply the proof

Attach `codeRefs` for every proof item — to the scenario that claims the
behavior and to its journey. Prefer `path#symbol`; never invent line numbers.
Repair `codeRefs` the implementation moved.

Every path must already be tracked by Git. If evidence depends on an untracked
file, that is a decision, not proof: ask the user to stage or commit it, and
never change the index yourself.

Report what you attached. Do not ask about it — nothing about the product
changed.

### 5. Order the decisions

Sort the queue before asking anything. Later questions often disappear once an
earlier one is answered, and asking them out of order wastes the user's
attention on decisions that were never real.

1. **Blocking** — anything that stops the model loading or validating.
2. **Dependency order** — if one answer determines another, ask the determining
   one first. A journey's existence precedes its scenarios. A business rule
   precedes the scenarios that would cite it. Whether an entire surface is in
   scope precedes anything inside it.
3. **Product impact** — behavior an actor or operator can observe, before
   internal organization, vocabulary, or coverage bookkeeping.
4. **Everything else** — coverage prose, limitations, hygiene.

### 6. Resolve them one at a time

Ask **one question, then wait.** Several at once is bewildering, and the second
one is often already answered by the first.

Every question carries:

- **what you found** — the model's claim and the code's behavior, with the
  exact files;
- **why it is a decision** — what would have to change, and where;
- **your recommendation**, and the reason for it. Never present a menu with no
  opinion;
- **what it affects** — the other queued items this answer will settle.

Apply the answer immediately. If the answer is that the **code** is wrong,
record the model's claim as it stands, note the gap in the report, and change
nothing — the model is already right.

### 7. Re-derive after every answer

Re-run `npx businesslens validate --json` and rebuild the remaining queue.
An answer may have:

- resolved queued items — drop them, and say which;
- created new ones — a new journey needs scenarios, a changed rule needs its
  scenarios rechecked;
- changed the right order for what is left.

Never work from the queue you built at the start.

### 8. Finish

Repeat 6 and 7 until the queue is empty. Then:

- check reverse relationships after every structural edit: actors referenced by
  experiences, features, and journeys; domains by features, journeys, and
  rules; features by journeys and rules; business rules by features and
  scenarios; experiences by features and journeys; and globally unique scenario
  IDs;
- update `coverage.md` when inspected or unmapped areas materially changed. On
  a `draft` model, move `status` off `draft` only once every journey and
  scenario is evidenced and every decision is resolved;
- resolve `<businesslens-sync-skill-dir>` to this installed skill directory and
  run the bundled validator outside the untrusted target:

  ```bash
  node <businesslens-sync-skill-dir>/scripts/run-businesslens.mjs \
    --root "$PWD" validate --json
  ```

A zero exit alone is not completion: a draft model reports missing evidence as
warnings. You are done when the queue is empty, validation has no errors, and
no missing-evidence warning remains unexplained.

### 9. Report

- **proof attached** — which entities, and the evidence cited;
- **decisions resolved** — the question, the answer, and what changed;
- **left to the user** — anything the answer put on their plate, especially
  code that must change to match the model;
- **unresolved** — anything that could not be established from source alone;
- validation result, and the next step.

## Guardrails

- Never modify implementation code.
- Never execute the target repository's application, build, migrations, or
  tests. Inspect files only.
- Never attach evidence for behavior you did not trace, and never round a
  partial implementation up to proof. "I could not establish this from source"
  is a real answer.
- Never resolve a decision on the user's behalf because the answer seems
  obvious. Recommend it, then wait.
- Never rewrite the whole model when a targeted update is enough.
- Never silently overwrite a plan with whatever the code currently does — when
  a plan exists, divergence is a decision, not a correction.
- Never copy prescriptive SDD text into the descriptive product model.
- Never submit or contribute the Product Model from this skill;
  `businesslens-contribute` is the explicit public-catalog workflow.
