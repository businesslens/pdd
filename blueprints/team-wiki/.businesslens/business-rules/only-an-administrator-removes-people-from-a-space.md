---
appliesTo:
  - type: entity
    id: space-membership
    effect: removes
permits:
  - actors: [administrator]
---

# Only an Administrator removes people from a space

A person is removed from a space only by an Administrator, and only once they
confirm. Members, Editors included, cannot remove one another.
