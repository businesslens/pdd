---
appliesTo:
  - type: entity
    id: decision
    effect: creates
permits:
  - related: [{ verb: settles, entity: poll }, { verb: owns, entity: member }]
    when: [{ entity: poll, fact: Closed at, present: true }]
---

# A decision is drafted only for a closed poll

A decision is started only once its poll has closed: by the poll's owner, written
themselves or generated at their request. A poll has at most one
decision.

## Rationale

A decision settles a question whose answer is in. Drafting earlier would
present an outcome before the team has finished voting.
