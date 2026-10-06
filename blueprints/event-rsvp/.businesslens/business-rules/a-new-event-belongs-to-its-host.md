---
appliesTo:
  - type: entity
    id: event
    effect: creates
permits:
  - related: [{ verb: owns, entity: host }]
---

# A new event belongs to its host

An event is created by a signed-in Host, and belongs from the start to that
Host as its only host. A Guest reaches events only through the invitations they
are given.

## Rationale

An event speaks for whoever holds it. Tying each one to the account that made it
is what lets only that Host change, cancel or message about it.
