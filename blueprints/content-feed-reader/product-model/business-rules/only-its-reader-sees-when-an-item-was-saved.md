---
appliesTo:
  - type: entity
    id: item
    effect: reads
    facts: [Saved at]
permits:
  - related: [{ verb: keeps, entity: reader }]
---

# Only its Reader sees when an item was saved

When an item was saved is read only by the Reader whose library keeps it. An
item shown in a published collection discloses its title and publication date,
never its owner's saving.

## Rationale

Saving is personal reading state; a published collection shares the owner's
selection, not their reading habits.
