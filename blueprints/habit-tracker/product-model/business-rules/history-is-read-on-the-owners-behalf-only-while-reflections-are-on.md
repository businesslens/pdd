---
appliesTo:
  - type: entity
    id: check-in
    effect: reads
permits:
  - related: [{ verb: records, entity: habit }, { verb: owns, entity: owner }]
  - unattended: true
    when: [{ entity: owner, fact: Reflections, is: On }]
---

# History is read on the Owner's behalf only while reflections are on

The Owner reads their own check-ins at any time. The Product reads them on its
own, and passes them to the language model that writes a summary, only while
the Owner has reflections on.

## Rationale

A habit history is personal. Turning the reflection off must stop the Product
from looking at it unprompted, not only stop the reflection from appearing.
