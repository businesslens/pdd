---
appliesTo:
  - type: entity
    id: event
    effect: creates
permits:
  - actors: [host]
---

# Only a host creates an event

An event is created by a signed-in Host, who becomes its only host. A Guest
reaches events only through the invitations they are given.

## Rationale

An event speaks for whoever holds it. Tying each one to the account that made it
is what lets only that Host change, cancel or message about it.
