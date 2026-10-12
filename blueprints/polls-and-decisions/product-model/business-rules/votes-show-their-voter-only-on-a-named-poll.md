---
appliesTo:
  - type: entity
    id: vote
    effect: reads
    facts: [Chosen options]
permits:
  - related: [{ verb: casts, entity: member }]
  - actors: [member]
    when:
      - { entity: poll, fact: Ballot, is: Named }
      - { entity: poll, fact: Results visibility, is: While open }
  - actors: [member]
    when:
      - { entity: poll, fact: Ballot, is: Named }
      - { entity: poll, fact: Closed at, present: true }
---

# Votes show their voter only on a named poll

A Member always sees their own vote. Other Members see what someone chose only
on a named poll, and only once its results are showing. On an anonymous poll
nobody, its owner included, sees who chose what; the
results are counts alone.

## Rationale

A Member votes on an anonymous poll on the promise that the vote can never be
traced back to them, and that promise must hold after the poll closes too.
