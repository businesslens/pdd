---
kind: primary
capability: collection-organization
actors: [reader]
availability:
  - interface: reader-web
    experiences: [personal-library]
  - interface: reader-mobile
    experiences: [personal-library]
---

# Remove an item from an owned collection

## Trigger

The Reader removes an item from an owned collection.

## Steps

1. The Product confirms collection ownership
2. The item is removed from that collection
3. The remaining item order and the item's saved state are preserved

## Outcome

The item no longer belongs to the collection and remains saved independently.
