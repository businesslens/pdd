---
kind: validation
capability: item-saving
actors: [reader]
availability:
  - interface: reader-web
    experiences: [personal-library]
  - interface: reader-mobile
    experiences: [personal-library]
---

# Reject saving an unavailable item

## Trigger

The Reader attempts to save an item no longer available in the library.

## Steps

1. The Product confirms that the item is unavailable
2. No saved record is created
3. The Reader sees that the item cannot be saved

## Outcome

The saved library is unchanged and contains no unusable item.
