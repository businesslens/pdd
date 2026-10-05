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
   - thorough: blank slate, vague, or cross-cutting; cover why, Entities —
     including the people and systems that act — Interfaces, optional
     Experiences, Product Screens, Domains, Capabilities, Capability Scenarios,
     Rules including who may act, optional Journeys and Journey Scenarios,
     availability Contexts, decisions, removals, and definition of done.

   In thorough mode, work the decisions in rounds and wait after each — every
   question whose prerequisites are settled, then stop; answers reshape what is
   still open. **Boundary** first (what the Product is, who it is for, which
   surfaces are supported Interfaces); then **Granularity** (one Capability or
   several; a family that could be one Entity or several, quoted with both
   counts; a Journey or a plausible sequence; a Business Rule or one
   Capability's prose); then **Coverage** (how many Scenarios each Capability
   needs, and where the line falls between a Scenario and an `## Edge cases`
   bullet); then **Naming** (the Product's own word for each thing now
   settled). Quick mode keeps its three batched questions.

   Hold the dialogue as the rubric's **Dialogue** section says. Make supported
   web/mobile/CLI/API/integration Interfaces an explicit Product decision; do
   not treat technologies or internal APIs as Interfaces. Follow the format
   reference for every shape and boundary — Interface division into Experiences
   (decide access from who will reach each place), Entities, the Capability
   split test, Business Rules, Journeys, Domains and naming — and decide whether
   a setting, assignment or deployment makes a Variation, separate Scenarios, a
   decision point or a grant's `when` by **What selects** under its Variations.
   Then sweep:
   - **Verbs.** Distinguish durable Capabilities from complete Actor goals and
     give every Capability per-Capability acceptance; plan a Journey wherever
     the Product carries the Actor from one Capability into another.
   - **Nouns.** Every new thing has a Step that creates it and a Step for each
     state it can reach, and a Screen presenting it with its facts, or the
     delta says why not. Where a family of things could be one Entity or
     several, ask with both shapes named rather than choosing the smaller
     model.
   - **Who may.** A permission is a grant on a Business Rule targeting the
     operation, never a sentence in a Scenario; an operation nobody may perform
     is `permits: []`.
8. In resolution mode, do not reopen broad ideation. Use the supplied finding,
   inspected files, and authority decision to draft the smallest exact model
   delta that makes the intended behavior unambiguous.
9. Present the complete model delta before writing: every resource added,
   changed, or removed; Capability and Journey acceptance Scenarios;
   relationship repairs; limitations; implementation work implied; and
   significant omissions, consequential modeling boundaries and material
   uncertainty, explained briefly in terms of the current proposal. Do not
   enumerate discarded options or repeat settled discussion; include
   `Open questions` only when questions remain. Get explicit approval.
10. After approval, write only inside `.businesslens/`:
    - blank slate: create the complete layout, canonical README, `.gitignore`,
      taxonomies, product, coverage, and all approved resources;
    - existing product: edit the living model to the intended state and repair
      relationships;
    - resolution: apply only the approved narrow delta.

    Write current product meaning under the guardrails below.
    Attach to each resource the artifacts that state its intended behavior — the
    PRD, spec, proposal or design the decision came from, with `role: intent` —
    and preserve existing References only where they remain useful. Keep every
    role honest and add no invented local targets: an intended-behavior model
    has no implementation to point at yet, and a `role: implementation` target
    that does not exist is a claim, not a link. Coverage describes model breadth
    and known gaps, not whether the plan is built; never author a status.
11. Run the bundled linter outside the untrusted target:

    ```bash
    node <businesslens-ideate-skill-dir>/scripts/run-businesslens.mjs \
      --root "$PWD" lint --json
    ```

    Fix every error and assess each warning. Green lint means structurally
    sound, not implemented or verified.
12. Report the approved delta and implementation acceptance contract. The next
    phase is implementation in the user's own workflow, followed by
    `businesslens-verify`.
    Do not implement from this skill.

## Guardrails

- Never write model meaning without explicit approval.
- Never persist rejected approaches, reasons another option was not selected,
  or deliberation history anywhere in `.businesslens/`, including resource prose,
  supporting sections, limitations, README, and additional files. Keep decision
  discussion in the conversation. An unchosen option is not a product exclusion;
  preserve approved constraints, refusal and failure behavior, and material
  unresolved questions or missing evidence.
- Never present a proposal as a decision or reopen a decision already supplied
  by a verification handoff.
- Keep model prose at product altitude; do not invent stacks, endpoints,
  schemas, or filenames.
- Treat availability as intended Product meaning. Author Contexts whose places
  are an undivided Interface or an Experience, and never use them as
  implementation status.
- Model a Screen only as a place, never design; the rubric's **Places, not
  designs** test decides.
- Keep visuals and research external through References. Use `role: intent` for
  curated inputs and `role: context` for background; neither is an acceptance
  receipt.
- Never infer implementation state from References or Coverage.
- Never execute target code, stage, commit, submit, or contribute.
- Never write outside `.businesslens/`; leave target `AGENTS.md`, `CLAUDE.md`,
  and root README byte-identical.
