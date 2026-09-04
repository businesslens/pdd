---
kind: primary
result: achieved
steps:
  - text: The Reader saves the item
    kind: actor
    actor: reader
    capability: save-item
    entities:
      - { entity: item }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile-to-web:
        place: reader-mobile::personal-library::unread-library
  - text: The Reader creates and names a collection
    kind: actor
    actor: reader
    capability: create-collection
    entities:
      - { entity: collection, effect: creates, to: Private }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
      mobile-to-web:
        place: reader-web::personal-library::collection-workspace
  - text: The saved item is added to the collection
    kind: product
    actor: reader
    capability: organize-collection
    entities:
      - { entity: collection }
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
      mobile-to-web:
        place: reader-web::personal-library::collection-workspace
routes:
  web: Web
  mobile-to-web: Mobile to web
---

# Save an item into a new collection

## Trigger

The Reader finds a worthwhile item that belongs in a new collection.

## Outcome

The Journey goal is achieved: the item is saved in the new owned collection.
