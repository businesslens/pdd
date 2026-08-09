---
kind: primary
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
  - capability: collections
    operation: Create an owned collection and add the item
    availability:
      - interface: reader-web
        experiences: [personal-library]
      - interface: reader-mobile
        experiences: [personal-library]
---

# Save an item into a new collection

## Trigger

The Reader finds a worthwhile item that belongs in a new collection.

## Steps

1. The Reader saves the item
2. The Reader creates and names a collection
3. The saved item is added to the collection

## Outcome

The Journey goal is achieved: the item is saved in the new owned collection.
