---
kind: edge
actors: [reader]
result: achieved
flow:
  - id: save-item
    capability: item-saving
    operation: Save the worthwhile item
  - id: add-to-collection
    capability: collection-organization
    operation: Add the item to the chosen owned collection
routes:
  - id: web
    contexts:
      - stage: save-item
        context: reader-web::personal-library
      - stage: add-to-collection
        context: reader-web::personal-library
  - id: mobile
    contexts:
      - stage: save-item
        context: reader-mobile::personal-library
      - stage: add-to-collection
        context: reader-web::personal-library
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
