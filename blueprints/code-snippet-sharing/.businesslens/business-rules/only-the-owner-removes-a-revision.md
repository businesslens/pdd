---
appliesTo:
  - type: entity
    id: revision
    effect: removes
permits:
  - related: [{ verb: holds, entity: snippet }, { verb: owns, entity: developer }]
---

# Only the owner removes a revision

A revision is removed only when the owner deletes its snippet, which takes
every revision with it. No revision is removed on its own.

## Rationale

A history that could be trimmed would no longer show what the code really was;
the only way to end it is to end the snippet.
