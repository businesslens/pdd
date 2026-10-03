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
   surfaces are supported Interfaces), because everything hangs off it; then
   **Granularity** (one Capability or several; a family that could be one Entity
   or several, quoted with both counts; a Journey or a plausible sequence; a
   Business Rule or one Capability's prose); then **Coverage** (how many
   Scenarios each Capability needs, and where the line falls between a Scenario
   and an `## Edge cases` bullet); then **Naming** (the Product's own word for
   each thing now settled — which is where models of one product stop being
   comparable, and the one thing a user answers in seconds).

   Quick mode keeps its three batched questions: a small specific change does
   not have a frontier.

   Propose concrete wording so the user corrects drafts rather than dictating
   schema. Make supported web/mobile/CLI/API/integration Interfaces an explicit
   Product decision; do not treat technologies or internal APIs as Interfaces.
   Whether an Interface is divided into Experiences is derived, never judged,
   from audience and access: divide it when it serves more than one `access`
   value, or when its Actors split into groups no Capability available there
   bridges (a Capability bridges the Actors its Scenario Steps name, and roles
   sharing an Account are one group). Otherwise
   it holds no Experiences and availability names the Interface directly.
   `lint` decides and reports a violation as an error; counterparts across
   Interfaces and Experiences that are alternatives in one Variation justify
   themselves. Do not apply a prose test of your own. For
   A/B and other supported alternatives, write one `variations/<id>.md` per the
   shared format reference: membership only on the set, each selection field
   once, no keys on the alternatives. Vary the smallest resource that contains
   the difference — two Scenarios of one owner when one Step differs. A setting,
   assignment, version or deployment fixed before the behavior selects a
   Variation; state the behavior meets, including a value kept on the thing it
   acts on, is a Scenario condition. A parameter value is plain content, and a
   design-only difference is a visual Reference.
   Distinguish durable Capabilities from complete Actor goals. Give every
   Capability per-Capability acceptance. Decide the nouns as deliberately as the
   verbs: create an Entity for a thing an Actor would call *"this one"* and the
   Product can tell apart from another, one Entity per thing the Product treats
   differently, name its facts, and say on each Step what it does to which
   Entities — creates, changes, removes, or reads, with the states it leaves and
   lands in, or `[]` — and on each Screen the Entities it presents, with the
   facts on screen. A Capability declares none, and an Entity nothing changes,
   presents, names as an actor, or reads by Rule is unused vocabulary. Sweep
   the nouns after the verbs: every
   new thing has a Step that creates it and a Step for each state it can reach,
   or the delta says why not. Decide who may as deliberately as what: a
   permission is a grant on a Business Rule targeting the operation, never a
   sentence in a Scenario, and an operation nobody may perform is `permits: []`.
   Where a family of things could be one Entity or several, ask with both shapes
   named rather than choosing the smaller model. Plan a Journey wherever the Product
   carries the Actor from one Capability into another toward one outcome; define its Scenario as
   one ordered typed Steps list, annotating responsible Actors and Capabilities
   while named routes select most-specific Context places.

   **Apply the rubric's product/design border.** Screen entities separate
   `shows` from `collects`; Capabilities derive from placed Steps. Step facts
   are exhaustive for reads, changes and creation. Screen ownership follows a
   persistent working context, never merely the act of opening a destination.
   Use a grant's `when` only for whether someone may perform an Entity
   operation, and a Variation, never a condition, when a setting selects the
   form of the behavior. Keep ordinary copy external; verify exact wording when a Rule
   makes it contractual. Consult the rubric for the boundary cases.

8. In resolution mode, do not reopen broad ideation. Use the supplied finding,
   inspected files, and authority decision to draft the smallest exact model
   delta that makes the intended behavior unambiguous.
9. Present the complete model delta before writing: every resource added,
   changed, or removed; Capability and Journey acceptance Scenarios;
   relationship repairs; limitations; and implementation work implied. Get explicit approval.

   Present the selected model shape and its consequences. Surface significant
   omissions, consequential modeling boundaries, and material uncertainty needed
   for approval. Explain these briefly in terms of the current proposal. Do not
   enumerate discarded options or repeat settled discussion. Include
   `Open questions` only when questions remain.
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
    phase is the user's injected build flow, followed by `businesslens-verify`.
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
- Model a Screen only for a stable view an Actor reaches, as a place: what is
  reachable, which facts are on screen, which abilities it offers, which
  conditions change that. Never write design: component libraries, theming,
  layout, typography, color, iconography, motion, microcopy and tone, gestures
  versus buttons, breakpoints, loading and hover states, navigation chrome and
  the order of navigation items, and quality attributes that do not change
  what an Actor can do belong in `visual` References with `role: intent`.
- Keep visuals and research external through References. Use `role: intent` for
  curated inputs and `role: context` for background; neither is an acceptance
  receipt.
- Never infer implementation state from References or Coverage.
- Never execute target code, stage, commit, submit, or contribute.
- Never write outside `.businesslens/`; leave target `AGENTS.md`, `CLAUDE.md`,
  and root README byte-identical.
