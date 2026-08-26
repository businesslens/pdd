# 0006 — Determinism is verified by independent double-authoring

Status: **Accepted** — 2026-08-26

## Context

Ambiguity that is visible in the text can be found by reading. Ambiguity that is
invisible in the text — where the rule's own author cannot see their assumption
— cannot. Reading the rules to check whether they are ambiguous is grading one's
own reading.

The review's central instrument was therefore empirical: BusinessLens mapped
twice by two authors, from one rubric, with no contact between them, then
diffed. It surfaced divergences that no amount of re-reading had produced,
including a required closed-enum field with two different values and an inverted
Business Rule / Scenario boundary.

## Decision

A determinism claim about a format rule is established **empirically, by
independent double-authoring and diff**, not analytically.

Diff classification:

- **Both defensible** → a determinism defect. No adjudication is needed; the
  damage is the divergence itself, not which output is better.
- **One plainly wrong against the spec** → a distillation defect in the rubric
  (see [0001](./0001-shipped-agent-is-the-standard-of-judgment.md)).
- **Residue** → adjudicated by someone who knows the product.

## Consequences

- A fix to an ambiguous rule is validated by re-running the double-authoring,
  not by inspecting the new wording.
- The corpus must include a target that exercises the rule; a joint no test
  product has cannot be tested this way. Both authors correctly wrote zero
  Experiences for this repository, so the Interface/Experience boundary needed a
  separate encoding probe.
- Divergence measured where both authors could see the full spec is a **lower
  bound** on field divergence.
