---
appliesTo:
  - { type: entity, id: notebook, effect: removes }
permits:
  - related: [{ verb: keeps, entity: owner }]
---

# Only the owner deletes their notebooks

A notebook is deleted only by the Owner who keeps it, and only after they
confirm that its notes will return to the inbox.

## Rationale

Deleting a notebook sends its notes back to be sorted again, which only the
Owner can choose to take on.
