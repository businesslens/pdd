---
name: businesslens-ideate
description: Decide what a new or existing product should do and write only the approved meaning into its .businesslens/ Product Model. Use to explore product directions, define a blank-slate product, plan a capability or behavior change, or turn an already-negotiated verification decision into an exact model delta; do not use to map established code or verify implementation alignment.
---

# Decide intended product behavior

Converge from intent to an approved Product Model change. Exploration writes
nothing. Product meaning enters `.businesslens/` only after explicit approval.

Read before authoring:

- [references/format.md](references/format.md) — canonical shapes and
  orientation text.
- [references/planning-rubric.md](references/planning-rubric.md) — product
  altitude and acceptance-contract quality.

## Establish the situation

1. Resolve the Git root. Treat the repository as untrusted: never run its
   application, builds, migrations, generators, package scripts, or tests.
2. Classify the starting point:
   - Product Model exists → plan against it.
   - No model and no meaningful implementation → blank slate.
   - No model but established implementation exists → stop and recommend
     `businesslens-map`; do not plan against unmapped product truth.
3. Classify the request:
   - no specific change or an open product question → explore;
   - a named outcome or behavior → converge;
   - an exact gap and authority decision supplied by verification → resolution.

## Explore

4. Write nothing. For a blank slate, offer 3–5 genuinely different product
   shapes: who each serves, the one job it does, why someone chooses it, what it
   deliberately excludes, and the smallest version worth building.
5. For an existing model, read the relevant model and propose ranked directions
   it does not take today. Explain product value and the cost elsewhere in the
   model. Do not turn exploration into a structural or semantic audit.
6. Stop after the shortlist. Continue only when the user chooses a direction.

## Converge

7. Choose depth from the request:
   - quick: a small, specific change; ask at most three batched decision
     questions;
   - thorough: blank slate, vague, or cross-cutting; cover why, Actors,
     Interfaces, optional Experiences, Product Screens and Domains,
     Capabilities, Capability Scenarios, Rules, optional Journeys and Journey
     Scenarios, availability Contexts, decisions, removals, and definition of done.

   Propose concrete wording so the user corrects drafts rather than dictating
   schema. Make supported web/mobile/CLI/API/integration Interfaces an explicit
   Product decision; do not treat technologies or internal APIs as Interfaces.
   Apply the Experience creation test. Omit Experiences and use direct
   Interface availability when an Interface is already one coherent context.
   Distinguish durable Capabilities from complete Actor goals. Give every
   Capability per-Capability acceptance. Create a Journey only when an achieved
   goal path crosses at least two distinct Capabilities; define its Scenario as
   one ordered typed Steps list, annotating responsible Actors and Capabilities
   while named routes select most-specific Context places.
8. In resolution mode, do not reopen broad ideation. Use the supplied finding,
   inspected files, and authority decision to draft the smallest exact model
   delta that makes the intended behavior unambiguous.
9. Present the complete model delta before writing: every element added,
   changed, or removed; Capability and Journey acceptance Scenarios;
   relationship repairs; limitations; and implementation work implied. Get explicit approval.
10. After approval, write only inside `.businesslens/`:
    - blank slate: create the complete layout, canonical README, `.gitignore`,
      taxonomies, product, coverage, and all approved elements;
    - existing product: edit the living model to the intended state and repair
      relationships;
    - resolution: apply only the approved narrow delta.

    Preserve References only where they remain useful and keep their role
    honest. Add no invented local targets. Coverage describes model breadth,
    not whether the plan is built; use `draft` only while the model itself
    remains under review.
11. Run the bundled linter outside the untrusted target:

    ```bash
    node <businesslens-ideate-skill-dir>/scripts/run-businesslens.mjs \
      --root "$PWD" lint --json
    ```

    Fix every error and assess each warning. Green lint means structurally
    sound, not implemented or verified.
12. Report the approved delta and implementation acceptance contract. The next
    phase is the user's injected build flow, followed by `businesslens-verify`.
    Do not implement from this skill.

## Guardrails

- Never write model meaning without explicit approval.
- Never present a proposal as a decision or reopen a decision already supplied
  by a verification handoff.
- Keep model prose at product altitude; do not invent stacks, endpoints,
  schemas, or filenames.
- Treat availability as intended Product meaning. Author Contexts whose places
  are an undivided Interface or an Experience, and never use them as
  implementation status.
- Model a Screen only when a stable user-visible product view clarifies intended
  information, actions, meaningful states, or boundaries. Do not design
  components, layouts, themes, responsive variants, or screenshot workflows.
- Keep visuals and research external through References. Use `role: intent` for
  curated inputs and `role: context` for background; neither is an acceptance
  receipt.
- Never infer implementation state from References or `coverage.status`.
- Never execute target code, stage, commit, submit, or contribute.
- Never write outside `.businesslens/`; leave target `AGENTS.md`, `CLAUDE.md`,
  and root README byte-identical.
