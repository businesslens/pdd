---
kind: primary
businessRules:
  - a-subscription-never-grants-write-access
---

# A reader subscribes to a published collection

## Trigger

A reader holding a session opens a published collection and subscribes to it.

## Steps

1. The collection appears in the reader's reading application alongside their own collections, marked as someone else's
2. Its items are readable there without leaving the application
3. The owner's name is shown; no other detail about the owner is reachable
4. The reader can unsubscribe at any time, which removes it and nothing else

## Outcome

The reader follows one collection, not its owner, and can read it without
returning to the link they were sent.

## Edge cases

- Subscribing to one's own collection is not offered; the owner already has it
