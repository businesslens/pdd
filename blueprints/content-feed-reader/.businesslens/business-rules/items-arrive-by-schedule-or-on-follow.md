---
appliesTo:
  - type: entity
    id: item
    effect: creates
permits:
  - unattended: true
  - actors: [reader]
---

# Items arrive by schedule or on follow

New items are collected by the Product's own schedule, or when a Reader follows
a source and asks for its backlog. Nobody else puts an item in a library.

## Rationale

A library is the Reader's own. What lands in it comes from the sources they
chose, on the Product's cadence or on their request.
