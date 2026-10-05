---
appliesTo:
  - type: capability
    id: subscribe-to-updates
  - type: capability
    id: unsubscribe
---

# A subscription changes only through its own links

A subscription is confirmed only from the link sent to its address, and ended
only from the unsubscribe link in a message sent to it. The page never shows
which addresses are subscribed.

## Rationale

Holding the address's mail is the only proof the Product has that the person
acting is the subscriber.
