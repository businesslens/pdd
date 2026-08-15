---
kind: edge
actors: [reader]
result: achieved
steps:
  - text: The Reader saves the item
    capability: item-saving
    routes:
      web: reader-web::personal-library
      mobile: reader-mobile::personal-library
  - text: The Reader selects an owned collection
  - text: The saved item is added at the chosen position
    capability: collection-organization
    routes:
      web: reader-web::personal-library
      mobile: reader-web::personal-library
---

# Save an item into an existing collection

## Trigger

The Reader finds a worthwhile item for an existing owned collection.

## Outcome

The Journey goal is achieved: the item is saved in the intended owned collection.
