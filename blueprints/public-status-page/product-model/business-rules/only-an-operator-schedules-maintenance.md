---
appliesTo:
  - type: entity
    id: maintenance
    effect: creates
permits:
  - actors: [operator]
---

# Only an Operator schedules maintenance

Only an Operator announces a maintenance window. The Product never schedules
one on its own.
