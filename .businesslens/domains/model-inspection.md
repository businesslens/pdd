---
colorSlot: 3
references:
  - kind: doc
    role: context
    target: docs/cli-lint.md
---

# Model inspection

Looking at a Product Model without changing it: checking that it is structurally
sound, presenting it so a person can read what it says, and accounting for
repository inputs against an explicit captured state.

## Boundary

Owns the deterministic structural rules and the local reading surfaces. It does
not own product meaning, and it never claims that implementation agrees with the
model — that judgement is made elsewhere and cannot be inferred from a clean
result here.
