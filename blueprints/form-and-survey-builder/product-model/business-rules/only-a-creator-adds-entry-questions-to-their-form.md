---
appliesTo:
  - type: entity
    id: entry-question
    effect: creates
permits:
  - related: [{ verb: holds, entity: form }, { verb: owns, entity: creator }]
---

# Only a Creator adds entry questions to their form

Only the Creator who owns a form adds entry questions to it, by hand or by asking for
drafts to be proposed.

## Rationale

What a form asks is its Creator's decision, and a public link lets people
answer a form, never shape it.
