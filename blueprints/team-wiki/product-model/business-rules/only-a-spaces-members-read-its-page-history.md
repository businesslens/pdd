---
appliesTo:
  - type: entity
    id: revision
    effect: reads
permits:
  - related: [{ verb: keeps, entity: page }, { verb: contains, entity: space }, { verb: has, entity: space-membership }, { verb: holds, entity: member }]
---

# Only a space's members read its page history

Earlier revisions of a page, and who saved them, are read only by the Members
who belong to the page's space.

## Rationale

An earlier revision can hold exactly what a later edit removed, so history is
never more widely readable than the page itself.
