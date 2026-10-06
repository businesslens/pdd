---
appliesTo:
  - type: entity
    id: incident
    effect: changes
permits:
  - actors: [operator]
---

# Only an Operator changes an incident

Only an Operator moves an incident to another status, by posting the update that
announces it. Preparing a draft reads an incident and never changes it.
