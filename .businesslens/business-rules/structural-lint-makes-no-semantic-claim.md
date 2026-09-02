---
appliesTo:
  - type: capability
    id: lint-product-model
  - type: capability
    id: verify-model-alignment
references:
  - kind: spec
    role: intent
    target: spec/format.md
    title: The .businesslens/ folder contract
  - kind: doc
    role: context
    target: docs/cli-lint.md
---

# Structural lint makes no semantic claim

A clean structural result means the model is well formed. It never means the
model is true, that the code agrees with it, that a grant the model states is
enforced, or that anything was verified. Nothing downstream — a pipeline, a
report, or a later run — may treat it as evidence of alignment, and a
verification run says which scope it inspected rather than that the product is
proven.

## Rationale

Two different claims that both come back green are the easiest pair of claims in
software to confuse. Keeping them separate is what makes either of them worth
anything, so the cheap deterministic check is deliberately prevented from
implying the expensive semantic one.
