---
appliesTo:
  - type: entity
    id: guest
    effect: changes
permits:
  - self: true
  - unattended: true
---

# Only the guest or the waitlist changes an answer

A Guest's answer and plus-one are changed by that Guest, through their personal
link, or by the Product itself when the waitlist gives them a spot. The Host
reads answers and never changes them.

## Rationale

An answer is the guest's own word to the host. The guest list is trustworthy
only while each entry says what its guest last said.
