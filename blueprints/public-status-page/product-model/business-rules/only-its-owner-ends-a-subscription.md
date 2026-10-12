---
appliesTo:
  - type: entity
    id: subscription
    effect: removes
permits:
  - related: [{ verb: owns, entity: visitor }]
---

# Only its owner ends a subscription

A subscription is ended only by the Visitor who receives its mail, from the
unsubscribe link in a message sent to it.

## Rationale

Nobody else can stop another person's updates, and the subscriber never needs
an account to leave.
