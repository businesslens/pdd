---
kind: permission
businessRules:
  - a-subscription-never-grants-write-access
  - only-an-owner-changes-a-collection
---

# A subscriber cannot change a collection they follow

## Trigger

A subscriber viewing a collection they follow attempts to add an item, remove
one, reorder it, rename it, or change who can see it.

## Steps

1. None of those actions are offered on a collection the reader does not own
2. An attempt made any other way is refused
3. The collection is unchanged for its owner and for every other subscriber
4. The subscriber is offered the actions they do have: saving an item into their own library, or unsubscribing

## Outcome

The collection remains exactly what its owner curated, and the subscriber is
pointed at the things they can actually do rather than at a disabled control.
