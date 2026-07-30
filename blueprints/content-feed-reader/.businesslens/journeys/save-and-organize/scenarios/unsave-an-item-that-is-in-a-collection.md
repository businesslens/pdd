---
kind: conflict
businessRules:
  - saved-items-outlive-their-source
---

# Unsaving an item that a collection depends on

## Trigger

A reader unsaves an item that is currently part of one or more of their
collections.

## Steps

1. The product names the collections the item belongs to
2. The reader confirms, choosing to remove it from those collections as well
3. The item is removed from every collection that held it and is no longer saved
4. The collections keep their remaining items and order

## Decision points

### Collection membership

Does the item belong to any collection?

- yes → name them and require confirmation, because unsaving changes those collections too
- no → unsave it directly

## Outcome

The reader is never left with a collection referring to something the product may
prune, and is never surprised by an item vanishing from a collection they
published.

## Edge cases

- Removing an item from a collection does not unsave it; only the reverse requires a decision
