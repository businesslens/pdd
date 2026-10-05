---
appliesTo:
  - type: entity
    id: decision
    effect: reads
permits:
  - related: [{ verb: settles, entity: poll }, { verb: owns, entity: member }]
  - actors: [member]
    when: [{ state: Recorded }]
---

# Only the poll owner reads a draft decision

A draft decision is seen only by its poll's owner. Every Member reads it once it
is recorded, in the decision log and on its poll.

## Rationale

An unconfirmed draft, especially a generated one, must never be
mistaken for what the team decided.
