---
appliesTo:
  - type: entity
    id: space-membership
    effect: changes
permits:
  - actors: [administrator]
---

# Only an Administrator changes a role in a space

A person who belongs to a space is made a Viewer or an Editor there only by an
Administrator. An Editor cannot raise or lower anyone's role, their own
included.
