---
kind: edge
journey: save-and-organize
actors: [reader]
result: achieved
flow:
  - capability: item-saving
    operation: Save the worthwhile item
    availability:
      - interface: reader-web
        experiences: [personal-library]
      - interface: reader-mobile
        experiences: [personal-library]
  - capability: collection-organization
    operation: Add the item to the chosen owned collection
    availability:
      - interface: reader-web
        experiences: [personal-library]
      - interface: reader-mobile
        experiences: [personal-library]
---

# Save an item into an existing collection

## Trigger

The Reader finds a worthwhile item for an existing owned collection.

## Steps

1. The Reader saves the item
2. The Reader selects an owned collection
3. The saved item is added at the chosen position

## Outcome

The Journey goal is achieved: the item is saved in the intended owned collection.
