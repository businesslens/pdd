---
appliesTo:
  - type: entity
    id: suggestion
---

# A note has at most one proposed suggestion

A new suggestion for a note is refused while an earlier one for the same note
is still proposed. Once the Owner accepts or dismisses it, the AI agent may
suggest for that note again. A suggestion names only a notebook the Owner
already has.

## Rationale

Suggestions compete for the Owner's attention. One at a time per note keeps the
suggestion list something the Owner can finish.
