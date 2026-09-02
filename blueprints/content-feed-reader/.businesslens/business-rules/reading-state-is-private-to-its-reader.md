---
appliesTo:
  - type: entity
    id: item
    effect: changes
permits:
  - related: [{ verb: keeps, entity: reader }]
---

# Reading state is private to its Reader

Only the Reader whose library holds an item changes whether it is read, unread,
or saved.

## Rationale

Reading progress is personal working state, not information exposed through
shared collections.
