---
appliesTo:
  - type: entity
    id: rsvp
    effect: reads
    facts: [Name, Email]
permits:
  - related: [{ verb: has, entity: event }, { verb: owns, entity: host }]
  - related: [{ verb: gives, entity: guest }]
  - unattended: true
---

# Guest contact details are for the host

The name and email on an RSVP are seen by the Host of its event and by the
Guest who gave it, and used by the Product only to email that Guest. The
invitation never shows one guest's details to another.

## Rationale

Anyone holding a public link can open the invitation. Answering it must not
expose who else is coming or how to reach them.
