---
appliesTo:
  - type: entity
    id: study-session
    effect: reads
    facts: [Start, Logged minutes]
---

# A session is missed once its day passes unlogged

A planned session is shown as missed once the day it was planned for has ended
without the Student logging it. Missed is read from the session's start and
whether it was logged; it stops as soon as the session is logged or moved to a
day still ahead.

## Rationale

Missed sessions are what the Planning assistant revises around, so the Product
must say plainly and in one way when a session counts as missed.
