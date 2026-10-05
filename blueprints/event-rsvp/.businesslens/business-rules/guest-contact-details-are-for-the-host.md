---
appliesTo:
  - type: entity
    id: guest
    effect: reads
    facts: [Name, Email]
permits:
  - related: [{ verb: has, entity: event }, { verb: owns, entity: host }]
  - self: true
  - unattended: true
---

# Guest contact details are for the host

A Guest's name and email are seen by the Host of their event and by that
Guest, and used by the Product only to email that Guest. The invitation never
shows one guest's details to another.

## Rationale

Anyone holding a public link can open the invitation. Answering it must not
expose who else is coming or how to reach them.
