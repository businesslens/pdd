---
appliesTo:
  - type: entity
    id: rsvp
    effect: removes
permits:
  - related: [{ verb: has, entity: event }, { verb: owns, entity: host }]
---

# Only its host removes an RSVP

An RSVP is removed only by the Host of its event. A Guest who no longer wants
to come answers not going instead.

## Rationale

The guest list is the host's to keep clean, but a guest who has answered should
still show up on it unless the host decides otherwise.
