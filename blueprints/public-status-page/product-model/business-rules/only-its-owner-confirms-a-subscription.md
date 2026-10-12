---
appliesTo:
  - type: entity
    id: subscription
    effect: changes
permits:
  - related: [{ verb: owns, entity: visitor }]
---

# Only its owner confirms a subscription

A subscription is confirmed only by the Visitor who receives its mail, from the
link sent to its address. The page never shows which addresses are subscribed.

## Rationale

Holding the address's mail is the only proof the Product has that the person
acting is the subscriber.
