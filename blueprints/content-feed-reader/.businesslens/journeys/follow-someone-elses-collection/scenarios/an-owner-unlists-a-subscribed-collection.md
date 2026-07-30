---
kind: permission
businessRules:
  - unlisting-revokes-anonymous-access
---

# A subscription ends when its collection is unlisted

## Trigger

The owner of a collection unlists it while other readers are subscribed to it.

## Steps

1. Every subscription to the collection ends
2. The collection disappears from each subscriber's reading application, with an explanation that its owner is no longer sharing it
3. Items a subscriber had saved into their own library from that collection remain theirs
4. No subscriber is told anything further about the collection or its owner

## Decision points

### What the subscriber keeps

Had the subscriber saved any of the collection's items into their own library?

- yes → those items remain, and the rest of the collection becomes unreachable
- no → the collection becomes unreachable in full, leaving nothing behind

## Outcome

The owner's decision to stop sharing is honored completely, and a subscriber
keeps only what they had already deliberately saved for themselves.
