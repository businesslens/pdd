---
appliesTo:
  - type: entity
    id: incident
    effect: creates
  - type: entity
    id: incident
    effect: changes
permits:
  - actors: [operator]
---

# Only an Operator changes an incident

Only an Operator declares an incident or moves it to another status. Preparing
a draft reads an incident and never changes it.
