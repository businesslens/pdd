---
appliesTo:
  - type: entity
    id: form
    effect: changes
permits:
  - related: [{ verb: owns, entity: creator }]
---

# Only a Creator changes their form

Only the Creator who owns a form changes its title, introduction, goal or
question order, publishes it, closes it, or opens it again.

## Rationale

A public link lets people answer a form, never shape it, and a form has one
author.
