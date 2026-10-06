---
appliesTo:
  - type: entity
    id: space-membership
    effect: creates
  - type: entity
    id: space-membership
    effect: changes
  - type: entity
    id: space-membership
    effect: removes
permits:
  - actors: [administrator]
---

# Only an Administrator decides who belongs to a space

People are added to a space, given another role there, or removed from it only
by an Administrator. Belonging to a space, even as its Editor, gives no say over
who else belongs to it.
