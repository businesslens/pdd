---
appliesTo:
  - type: entity
    id: rsvp
    effect: changes
permits:
  - related: [{ verb: gives, entity: guest }]
  - unattended: true
---

# Only its guest or the waitlist changes an RSVP

An RSVP's answer and plus-one are changed by the Guest who gave it, through its
personal link, or by the Product itself when the waitlist gives it a spot. The
Host reads answers and never changes them.

## Rationale

An answer is the guest's own word to the host. The guest list is trustworthy
only while each entry says what its guest last said.
