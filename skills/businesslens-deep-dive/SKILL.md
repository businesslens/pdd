---
name: businesslens-deep-dive
description: Expand one BusinessLens journey or experience to exhaustive, evidence-backed fidelity by mining its implementation and tests for scenarios, boundaries, and edge cases. Use when a named product area needs deeper coverage without remapping the repository.
---

# Deep-dive one product area

Require a journey ID or experience ID. If the invocation does not identify the
target, ask for it before editing.

Read [references/format.md](references/format.md),
[references/analysis-rubric.md](references/analysis-rubric.md), and
[references/evidence-policy.md](references/evidence-policy.md).

## Workflow

1. Locate the target under `.businesslens/` and read every current relation,
   scenario, link, and `codeRef`.
2. Follow the evidence into entry points, implementation, adjacent services,
   persistence, configuration, and tests. Never execute target code.
3. For a journey, enumerate evidenced scenario space:
   - primary success;
   - permission/authentication failure;
   - validation and malformed input;
   - conflict, idempotency, or concurrency behavior;
   - dependency timeout or external failure;
   - recovery and retry behavior.
4. Add only materially distinct scenarios. Give each a globally unique ID,
   concrete Trigger/Steps/Outcome, meaningful edge cases, and direct evidence.
   Point `businessRules` at the constraints the scenario must uphold.
5. For an experience, verify audience, access mode, entry points, exit
   contract, and capability boundary against actual guards and handlers.
   Reconcile every journey exposed through that experience.
6. Keep the target's `features` relation accurate: every journey belongs to at
   least one feature, and each referenced feature and business rule must exist.
   Add a missing business rule only when the evidence states a durable
   constraint; otherwise record it as a limitation.
7. Tighten weak evidence. Prefer `path#symbol`; use line ranges only when read
   directly from the current checkout.
8. Update `coverage.md` if the target's mapped or unmapped surface materially
   changed.
9. Run `npx businesslens validate --json` until green.
10. Report the target, scenarios or boundary changes, evidence added,
    validation result, and unresolved limitations.

## Guardrails

- Stay inside the selected journey or experience except for required relation
  repairs.
- Do not inflate scenario counts with implementation details invisible to the
  user or operator.
- Treat ambiguous behavior as a limitation, not a fact.
