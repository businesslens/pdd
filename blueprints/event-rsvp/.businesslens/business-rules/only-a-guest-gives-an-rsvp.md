---
appliesTo:
  - type: entity
    id: rsvp
    effect: creates
permits:
  - actors: [guest]
---

# Only a guest gives an RSVP

An RSVP is given by the person answering, through the invitation link. The
Host never adds one on a guest's behalf.

## Rationale

Every entry on the guest list is someone's own answer, so the host can trust it
without asking who put it there.
