---
appliesTo:
  - type: entity
    id: space-membership
    effect: creates
permits:
  - actors: [administrator]
---

# Only an Administrator adds people to a space

A person is added to a space, as a Viewer or an Editor, only by an
Administrator. Belonging to a space, even as its Editor, gives no say over who
else belongs to it.
