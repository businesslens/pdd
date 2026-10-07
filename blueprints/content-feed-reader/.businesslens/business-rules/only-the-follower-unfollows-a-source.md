---
appliesTo:
  - type: entity
    id: source
    effect: removes
permits:
  - related: [{ verb: follows, entity: reader }]
---

# Only the follower unfollows a source

Only the Reader who follows a source stops following it, and only after they
confirm. The items it already delivered stay in their library.

## Rationale

A source removed by anyone else would silently stop a Reader's reading without
their decision.
