---
appliesTo:
  - type: entity
    id: decision
    effect: creates
permits:
  - related: [{ verb: settles, entity: poll }, { verb: owns, entity: member }]
    when: [{ entity: poll, fact: Closed at, present: true }]
---

# Only the poll owner records a decision once it closes

Only the Member who owns a poll records its decision, and only once the poll has
closed. A poll has at most one decision, and a decision exists only once it is
recorded: what the owner writes, or a generated draft they start from, is kept
only when they record it.

## Rationale

A decision settles a question whose answer is in, and the record speaks for the
team, so the person who asked the question must read and confirm every word of
it before anyone else sees it.
