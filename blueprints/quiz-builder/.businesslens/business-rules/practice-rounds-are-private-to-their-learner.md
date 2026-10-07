---
appliesTo:
  - type: entity
    id: practice-round
    effect: reads
permits:
  - related: [{ verb: practices, entity: learner }]
---

# Practice rounds are private to their learner

A practice round is seen only by the learner practicing. The Product reads a
learner's earlier rounds only to assemble their next one; the Creator of the
quiz never sees them.

## Rationale

Learners practice freely when their mistakes in practice are nobody's business
but their own.
