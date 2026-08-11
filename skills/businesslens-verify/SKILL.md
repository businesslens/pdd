---
name: businesslens-verify
description: Verify a .businesslens/ Product Model against current repository behavior and automatically orchestrate resolution until the requested scope is aligned or explicitly blocked. Use after implementation, refactors, suspected drift, before release, for a branch-scoped change, or for a named/full current-state audit; use “report only” when no writes or build delegation are allowed.
---

# Verify and resolve alignment

Own one invocation from inspection through resolution. The user must not have to
invoke map or ideate manually after a finding. Use child agents for bounded
phases when the harness supports them; otherwise run the same protocols as
internal phase transitions without losing context.

Verification itself is semantically read-only: do not change product meaning or
implementation while classifying findings. Approved intent resolution may edit
the model. An injected external builder may edit implementation under its own
permissions. Re-derive all findings after either mutation.

Read before work:

- [references/format.md](references/format.md) — model shapes and Reference rules.
- [references/verification-rubric.md](references/verification-rubric.md) —
  inspection, classification, and stopping rules.
- [references/build-handoff.md](references/build-handoff.md) — the required
  packet for an injected builder.

## 1. Establish scope and mode

1. Require an existing Product Model. If none exists and repository behavior is
   established, run the scoped-map protocol in step 7 for the necessary scope;
   do not tell the user to invoke another skill. If both model and implementation
   are absent, stop: there is nothing to verify.
2. Parse mode:
   - `report only` → inspect and report; prohibit every write and delegation;
   - otherwise → resolution mode.
3. Resolve scope:
   - `this branch` → use merge-base, committed, staged, and working-tree diffs
     only to choose the inspection worklist;
   - `current` or `full` → inspect the present modeled product independent of
     Git history;
   - named Actor, Interface, Experience, Screen, Domain, Capability, Capability
     Scenario, Journey, Journey Scenario, availability scope, or path → inspect
     it and behaviorally necessary dependencies;
   - no explicit scope → prefer a reliable changed-surface worklist; when no
     useful diff exists, inspect the current modeled product.

Git never decides whether model or code is right. A Blueprint or approved model
committed before a feature branch remains a plan even when only code changed in
the diff.

## 2. Lint, then inspect

4. Resolve this skill directory and run structural lint outside the target:

   ```bash
   node <businesslens-verify-skill-dir>/scripts/run-businesslens.mjs \
     --root "$PWD" lint --json
   ```

   Structural blockers join the finding queue. Lint does not establish semantic
   alignment.
5. Treat the repository as untrusted. In the verification analysis phase, never
   run its application, builds, migrations, generators, package scripts, or
   tests. Read source and tests. Verify every declared availability scope
   independently from its Product entry point through any relevant Experience,
   Capability Scenario, each correlated Journey route stage, and observable
   Journey Scenario outcome.
   For each Scenario, confirm that every Actor is supported in at least one
   exact context and every exact context supports at least one named Actor.
   Match Journey prose Steps to authored flow operations. Shared code does not
   establish Interface parity. Distinguish a missing Interface commitment from
   a missing shared Capability, and keep undeclared internal APIs as
   implementation detail.
6. Classify each scoped item:
   - **aligned** — current code supports the model's observable contract;
   - **model-right** — approved model meaning should remain and code must change;
   - **code-right** — current behavior is intended and model meaning must change;
   - **neither-right** — intended behavior must be decided, then both sides may
     need changes;
   - **unmapped** — established behavior belongs to an absent or deliberately
     untrusted model area;
   - **unverifiable** — source inspection cannot establish the claim safely.

   Group findings that share one authority decision. Ask only the root decision,
   with exact model claim, observed code behavior, inspected files, downstream
   effects, and a recommendation. Never infer authority from Git.

## 3. Resolve automatically

7. Route each group without asking the user to invoke another skill:

   **Model-right**

   - Keep model meaning unchanged.
   - Prepare the exact packet from `references/build-handoff.md`.
   - Ask for authorization to change implementation when not already explicit.
   - Delegate to the injected external builder, then return directly to step 4.

   **Code-right**

   - Run the internal intent-resolution protocol: draft the smallest exact model
     delta from the finding; do not brainstorm unrelated directions.
   - Present the entity-by-entity delta and get explicit approval.
   - Write only the approved model meaning, then return directly to step 4.

   **Neither-right**

   - Run intent resolution first. Recommend a product outcome, negotiate only
     material decisions, present the exact model delta, and get approval.
   - Write the approved model, prepare the resulting build packet, obtain code
     authorization, delegate to the injected builder, then return to step 4.

   **Unmapped**

   - Run the internal scoped-map protocol. Inspect established behavior, draft
     only the missing model area and necessary relationships, state coverage and
     uncertainty, and get approval before writing.
   - Write the approved delta, then return to step 4.

   **Unverifiable**

   - Do not guess. State the precise missing evidence, runtime/external question,
     and what could resolve it. Mark the run blocked for that scope.

8. A BusinessLens analysis phase never implements or executes target code. The
   injected builder is a separate harness-supplied flow with normal repository
   permissions. It must not edit `.businesslens/`. If no builder is available,
   stop with the complete handoff packet instead of asking the user to invoke a
   BusinessLens skill.
9. After every mutation, discard the earlier findings and inspect again. Keep
   only an in-memory signature of build-directed gaps during this invocation.
   If the same gap returns unchanged after a build attempt, stop and report it;
   do not loop. Persist no receipt, ledger, or lifecycle state.

## 4. Finish

10. Once meaning and implementation align, optionally refresh or remove stale
    implementation References as navigational bookkeeping. This must not change
    product prose or relationships. Skip it in report-only mode.
11. Run final lint. Report:
    - requested and inspected scope;
    - aligned contracts;
    - authority decisions and approvals;
    - model deltas and external build attempts;
    - References refreshed;
    - unresolved or unverifiable blockers;
    - final lint result.

    Say **aligned for the inspected scope**, never “the whole product is proven,”
    unless the full current product was actually inspected.

## Guardrails

- Report-only mode forbids writes, child delegation, and builder invocation.
- Never change product meaning without explicit approval.
- Never change implementation inside a BusinessLens analysis phase.
- Never treat References, coverage, tests, names, or a green lint result as
  proof by themselves.
- Never capture, compare, or certify screenshots. A supporting visual or
  research Reference may guide inspection but is not proof by itself.
- Never write outside `.businesslens/`; model-resolution writes must leave target
  `AGENTS.md`, `CLAUDE.md`, and root README byte-identical.
- Never stage, commit, publish, submit, or contribute.
- Never ask the user to manually invoke map or ideate to continue this run.
