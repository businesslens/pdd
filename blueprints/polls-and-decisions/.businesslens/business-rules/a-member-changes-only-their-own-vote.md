---
appliesTo:
  - type: entity
    id: vote
    effect: changes
permits:
  - related: [{ verb: casts, entity: member }]
    when: [{ entity: poll, fact: Closed at, absent: true }]
---

# A Member changes only their own vote

A vote is changed only by the Member who cast it, and only while its poll is
open. A Member holds at most one vote per poll, so voting again changes that
vote rather than adding another.

## Rationale

One Member, one say: the tally must count every Member once, as they last
chose.
