---
appliesTo:
  - type: entity
    id: revision
    effect: creates
permits:
  - related: [{ verb: holds, entity: snippet }, { verb: owns, entity: developer }]
---

# Only the owner adds a revision

A revision is added to a snippet only by its owner saving it. Forking makes a
new snippet whose first revision belongs to the Developer who forked it.

## Rationale

A snippet's history is the owner's record of their own code, so nobody else
adds to it.
