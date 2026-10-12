---
appliesTo:
  - type: entity
    id: suggested-adjustment
    effect: creates
permits:
  - unattended: true
    when: [{ entity: owner, fact: Reflections, is: On }]
---

# Suggested adjustments are drafted only while the Owner has reflections on

A suggested adjustment is created only by the Product's own weekly schedule, as
part of a weekly reflection for an Owner who has reflections on. Nobody writes
one by hand, and a habit never has two waiting at once.

## Rationale

A suggestion reads the Owner's week on its own; it has to come from the
reflection they agreed to, and never pile up on one habit.
