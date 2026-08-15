---
kind: primary
actors: [reader]
result: achieved
steps:
  - text: The Reader saves the item
    capability: item-saving
    routes:
      web: reader-web::personal-library
      mobile: reader-mobile::personal-library
  - text: The Reader creates and names a collection
    capability: collection-creation
    routes:
      web: reader-web::personal-library
      mobile: reader-web::personal-library
  - text: The saved item is added to the collection
    capability: collection-organization
    routes:
      web: reader-web::personal-library
      mobile: reader-web::personal-library
---

# Save an item into a new collection

## Trigger

The Reader finds a worthwhile item that belongs in a new collection.

## Outcome

The Journey goal is achieved: the item is saved in the new owned collection.
