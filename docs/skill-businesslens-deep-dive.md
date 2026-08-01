---
title: deep-dive
description: Expand one journey or experience to exhaustive, evidence-backed fidelity.
section: open-source
group: Skills
order: 14
---

# `businesslens-deep-dive`

Takes one named journey or experience to exhaustive fidelity by mining its
implementation and tests for scenarios, boundaries, and edge cases — depth
without remapping the repository.

## When to use it

- A high-value journey needs its full scenario space mapped, not just the
  primary path.
- An experience's audience, access, entry points, or capability boundary
  should be verified against the actual guards and handlers.

## Invocation

```text
/businesslens-deep-dive browse-and-buy
/businesslens-deep-dive the storefront experience
```

A target ID is required; the skill asks for one if the invocation does not
identify it.

## What it reads and writes

Reads the target's relations, scenarios, links, and `codeRefs`, then
follows the evidence into entry points, implementation, adjacent services,
persistence, configuration, and tests. Writes new or tightened scenarios
under the target journey, corrected experience boundaries, stronger
`path#symbol` evidence, and a `coverage.md` update when the modelped surface
materially changed.

## How it works

For a journey it enumerates the evidenced scenario space — primary success,
permission and authentication failure, validation and malformed input,
conflict and idempotency, dependency timeout and external failure, recovery
and retry — and adds only materially distinct scenarios, each with a
globally unique ID, concrete Trigger/Steps/Outcome, and direct evidence.
For an experience it reconciles the declared boundary with what the code
actually guards, and every journey exposed through it. It validates until
green and reports unresolved limitations honestly.

## Guardrails

- Stays inside the selected target except for required relation repairs.
- Never inflates scenario counts with implementation detail invisible to
  the user or operator.
- Treats ambiguous behavior as a limitation, not a fact.
- Never executes target code or submits the Product Model.
