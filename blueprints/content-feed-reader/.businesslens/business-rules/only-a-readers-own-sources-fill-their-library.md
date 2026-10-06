---
appliesTo:
  - type: entity
    id: item
    effect: creates
permits:
  - unattended: true
  - related: [{ verb: keeps, entity: reader }]
---

# Only a Reader's own sources fill their library

New items enter a Reader's library only from the sources that Reader follows:
when they follow one, when they refresh, or on the Product's own schedule.
Nobody else puts an item in a library.

## Rationale

A library is the Reader's own. What lands in it comes from the sources they
chose, on the Product's cadence or on their request.
