---
appliesTo:
  - type: entity
    id: snippet
    effect: removes
permits:
  - related: [{ verb: owns, entity: developer }]
---

# Only the owner deletes a snippet

Only the Developer who owns a snippet deletes it, and its revisions go with it.
Deleting the original never deletes a fork another Developer made of it.

## Rationale

A fork is its own Developer's snippet from the moment it is made; the original's
owner decides only about the original.
