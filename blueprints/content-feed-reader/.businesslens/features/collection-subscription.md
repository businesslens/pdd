---
domain: sharing
actors:
  - collection-owner
  - collection-subscriber
  - visitor
experiences:
  - public-collection
  - reading-app
businessRules:
  - a-subscription-never-grants-write-access
  - unlisting-revokes-anonymous-access
---

# Collection subscription

Following a published collection so it appears in the subscriber's reading
application and updates as its owner changes it.

## Intent

Subscribing turns a link someone sent you into something that keeps arriving. It
is deliberately not a follow of the person: a subscriber tracks one collection,
not everything its owner ever publishes, so the owner can keep publishing without
broadcasting.

A subscribed collection is read-only everywhere it appears, and its items do not
enter the subscriber's own saved items unless the subscriber saves them.
