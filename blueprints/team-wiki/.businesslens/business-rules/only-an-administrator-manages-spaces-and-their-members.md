---
appliesTo:
  - type: entity
    id: space
    effect: creates
  - type: entity
    id: space-membership
    effect: creates
  - type: entity
    id: space-membership
    effect: removes
permits:
  - actors: [administrator]
---

# Only an Administrator manages spaces and their members

Spaces are created, and people added to or removed from them, only by an
Administrator. Belonging to a space, even as its Editor, gives no say over who
else belongs to it.
