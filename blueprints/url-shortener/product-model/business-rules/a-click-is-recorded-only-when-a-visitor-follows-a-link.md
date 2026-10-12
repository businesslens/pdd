---
appliesTo:
  - type: entity
    id: click
    effect: creates
permits:
  - actors: [visitor]
---

# A click is recorded only when a Visitor follows a link

A click comes into being only when a Visitor follows an active short address.
An Owner cannot add clicks to a link, and an API client cannot record them.

## Rationale

A link's analytics are worth reading only if every click in them is a real
follow of its short address.
