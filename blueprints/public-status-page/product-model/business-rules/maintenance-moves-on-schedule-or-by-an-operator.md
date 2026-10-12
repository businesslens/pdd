---
appliesTo:
  - type: entity
    id: maintenance
    effect: changes
permits:
  - actors: [operator]
  - unattended: true
---

# Maintenance moves on schedule or by an Operator

An Operator cancels or completes a maintenance window. The Product starts a
window and completes it on its own only at the times the Operator scheduled.
