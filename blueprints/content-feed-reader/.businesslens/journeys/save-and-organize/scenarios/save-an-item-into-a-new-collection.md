---
kind: primary
result: achieved
steps:
  - text: The Reader saves the item
    kind: actor
    actor: reader
    capability: item-saving
    places:
      web: reader-web::personal-library::unread-library
      mobile-to-web: reader-mobile::personal-library::unread-library
  - text: The Reader creates and names a collection
    kind: actor
    actor: reader
    capability: collection-creation
    places:
      web: reader-web::personal-library::collection-workspace
      mobile-to-web: reader-web::personal-library::collection-workspace
  - text: The saved item is added to the collection
    kind: product
    capability: collection-organization
    places:
      web: reader-web::personal-library::collection-workspace
      mobile-to-web: reader-web::personal-library::collection-workspace
routes:
  web: Web
  mobile-to-web: Mobile to web
---

# Save an item into a new collection

## Trigger

The Reader finds a worthwhile item that belongs in a new collection.

## Outcome

The Journey goal is achieved: the item is saved in the new owned collection.
