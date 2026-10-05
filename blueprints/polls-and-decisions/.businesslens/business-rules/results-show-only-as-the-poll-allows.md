---
appliesTo:
  - type: entity
    id: poll
    effect: reads
    facts: [Tally]
permits:
  - actors: [member]
    when: [{ fact: Results visibility, is: While open }]
  - actors: [member, assistant]
    when: [{ state: Closed }]
---

# Results show only as the poll allows

Members see a poll's results while it is open only when its results visibility
is While open; otherwise nobody, its owner included, sees a count until the
poll closes. Once it has closed, every Member sees the final results, and the
Assistant may read them to draft the decision.

## Rationale

Early counts steer later votes. A poll opened with hidden results promises the
team that no one, the person who asked included, sees which way it is going.
