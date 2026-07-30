---
name: businesslens-ideate
description: Propose candidate product directions — what a product could be, or what an existing Product Model should cover next. Produces a shortlist for a person to choose from and never writes to the model. Use when the user is deciding what to build; use businesslens-plan once they have decided.
---

# Ideate against a product model

Divergent, and the only BusinessLens skill that writes nothing. Ideation
proposes; a person chooses; `businesslens-plan` writes.

## Workflow

1. Detect the situation:
   - **No `.businesslens/` model** → propose candidate product shapes (step 2).
   - **A model exists** → propose what it is missing or what comes next (step 3).
2. Blank slate — from what the user tells you about the domain and the people in
   it, propose 3-5 distinct product shapes. Distinct means they would lead to
   different models, not different names for one idea. For each: who it serves,
   the one job it does, why someone would choose it, and what it deliberately is
   not. State the smallest version worth building.
3. Existing model — read it in full, then look for the gaps the structure makes
   visible rather than the features you happen to think of:
   - actors with thin or no experiences;
   - journeys whose scenarios cover only the primary path, with no permission,
     validation, conflict, or external-failure case;
   - business rules with no covering scenario, and scenarios enforcing something
     no rule states;
   - features reachable from no journey;
   - domains adjacent to what exists that the product implies but never covers;
   - limitations in `product.md` that have quietly stopped being true.
4. Rank the shortlist by what it would change for a user, not by how much work
   it is. Say plainly what you would do first and why.
5. For each candidate, note what it would cost elsewhere in the model — the rule
   it complicates, the journey it lengthens, the actor it introduces. An idea
   with no cost has usually not been thought through.
6. Present the shortlist and stop. When the user chooses, hand off to
   `businesslens-plan` with their choice.

## Guardrails

- **Never write into `.businesslens/`.** A Product Model holds what the product
  does, not what it might. Anything written here would be indistinguishable from
  a decision nobody made.
- Never present a proposal as a decision, and never proceed to planning on your
  own initiative — the handoff is the user's to make.
- Propose product behavior, not implementation. A stack, schema, or endpoint is
  out of scope at this altitude.
- Do not pad the list. Three real options beat six with three of them filler.
- Say when the honest answer is that nothing substantial is missing.
