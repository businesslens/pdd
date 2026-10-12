---
appliesTo:
  - type: entity
    id: weekly-reflection
    effect: creates
permits:
  - unattended: true
    when: [{ entity: owner, fact: Reflections, is: On }]
---

# Reflections are prepared only while the Owner has them on

A weekly reflection is created only by the Product's own schedule, and only for
an Owner who has reflections on. Nobody writes one by hand.

## Rationale

The reflection is optional: an Owner who never turns it on never has a week
read back to them.
