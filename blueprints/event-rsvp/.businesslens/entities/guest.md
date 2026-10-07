---
kind: person
acts: external
relations:
  - entity: rsvp
    verb: gives
    cardinality: one-to-many
domain: rsvps
---

# Guest

Anyone who answers an event's invitation through its link. A Guest has no
account; the Product knows them only by the name and email on their RSVP, and
the personal link emailed to them is how they come back to it.
