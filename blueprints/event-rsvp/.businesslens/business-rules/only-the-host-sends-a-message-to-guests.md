---
appliesTo:
  - type: entity
    id: message
    effect: creates
permits:
  - related: [{ verb: has, entity: event }, { verb: owns, entity: host }]
---

# Only the host sends a message to guests

A message reaches an event's guests only when that event's Host sends it.
Suggested wording is a draft in the Host's hands: the Product never sends a
message on its own, and nothing the Host has not sent is kept.

## Rationale

A message speaks for the host to people who trusted them with an email address.
Every word that reaches a guest has to be one the host chose to send.
