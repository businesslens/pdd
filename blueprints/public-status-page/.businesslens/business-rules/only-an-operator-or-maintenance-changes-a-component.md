---
appliesTo:
  - type: entity
    id: component
    effect: creates
  - type: entity
    id: component
    effect: changes
permits:
  - actors: [operator]
  - unattended: true
---

# Only an Operator or maintenance changes a component

An Operator adds and edits components and sets their status, directly or
through an incident. The Product changes a component's status on its own only
when a maintenance window starts or completes on schedule.

## Rationale

A status visitors see is a statement by the team. Apart from planned
maintenance the team announced, nothing else may make it.
