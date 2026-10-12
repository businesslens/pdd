---
appliesTo:
  - type: entity
    id: incident
    effect: creates
permits:
  - actors: [operator]
---

# Only an Operator declares an incident

Only an Operator opens an incident on the page. The Product never declares one
on its own.
