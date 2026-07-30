---
name: businesslens-implement
description: Build the software a Product Model describes, treating its scenarios as the acceptance contract. Use when a repository holds a .businesslens/ model with no implementation — a pulled catalog Blueprint, or a model planned before any code was written. Use businesslens-plan to change what the product should do; use businesslens-verify to attach evidence once it runs.
---

# Implement a product model

The model is the specification. Your job is to make it true.

Read these before writing code:

- `.businesslens/product.md` — what the product is and the outcome it protects.
- `.businesslens/business-rules/` — invariants that hold across every journey.
- `.businesslens/journeys/*/scenarios/` — the acceptance contract.

## Workflow

1. Confirm the situation: a `.businesslens/` model exists and there is no
   meaningful implementation of it. If substantial code already exists, stop and
   direct the user to `businesslens-init` to map today's truth first — never
   implement over unmapped code.
2. Read the whole model before writing anything. It is small by construction; a
   partial read produces a product that contradicts a rule you had not reached.
3. Choose the stack. The model deliberately prescribes none. Pick what fits the
   experiences and their entry points, state the choice and why in one short
   note to the user, and stay consistent.
4. Derive the work from the model, not from your instincts about the domain:
   - **experiences** become surfaces, with their `access` mode and `entryPoints`
     as real routes;
   - **actors** become the roles authorization is expressed in;
   - **features** become capabilities;
   - **business rules** become invariants enforced in one place each, not
     re-checked ad hoc at every call site;
   - **journeys and scenarios** become the behavior and the tests.
5. Implement in journey order, finishing each journey's scenarios before moving
   on. A half-built journey is harder to verify than an unstarted one.
6. **Write a test per scenario.** Each carries a Trigger, ordered Steps, a
   Decision points section when behavior branches, and an Outcome. That is a test
   case already; name the test after the scenario id so the mapping survives.
7. Run the product. A scenario that has never executed is not implemented.
8. Attach evidence with `businesslens-verify`, which adds `codeRefs` and moves
   coverage off `draft`. Then run `npx businesslens validate`.
9. Report: the stack you chose and why, journeys and scenarios implemented,
   anything in the model you could not satisfy, and what you deliberately left
   out.

## Guardrails

- **Never weaken the model to match the code.** If a scenario is wrong or
  impossible, say so and use `businesslens-plan` to change it deliberately — do
  not quietly implement something else.
- **Never add behavior the model does not describe.** An unrequested feature is
  unverifiable by definition, and the model stops being the source of truth the
  moment the code exceeds it.
- Do not invent product decisions to fill a gap. Ask, and record the answer in
  the model.
- Do not add `codeRefs` by hand; that is `businesslens-verify`'s job.
- Never edit `.businesslens/cache/` — generated.
