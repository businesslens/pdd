---
kind: primary
result: achieved
steps:
  - text: The Reader saves the item
    kind: actor
    actor: reader
    capability: save-item
    entities:
      - { entity: item, facts: [ Saved at ] }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile-to-web:
        place: reader-mobile::personal-library::unread-library
      mobile-to-web-source-focused:
        place: reader-mobile::source-focused-library::unread-library
  - text: The Reader creates and names a collection
    kind: actor
    actor: reader
    capability: create-collection
    entities:
      - { entity: collection, effect: creates, to: Private, facts: [ Name, Item order ] }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
      mobile-to-web:
        place: reader-web::personal-library::collection-workspace
      mobile-to-web-source-focused:
        place: reader-web::personal-library::collection-workspace
  - text: The saved item is added to the collection
    kind: product
    actor: reader
    capability: organize-collection
    entities:
      - { entity: collection, facts: [ Item order ] }
      - { entity: item, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
      mobile-to-web:
        place: reader-web::personal-library::collection-detail
      mobile-to-web-source-focused:
        place: reader-web::personal-library::collection-detail
routes:
  web: Web
  mobile-to-web: Mobile to web
  mobile-to-web-source-focused: Mobile to web — source-focused
---

# Save an item into a new collection

## Trigger

The Reader finds a worthwhile item that belongs in a new collection.

## Outcome

The Journey goal is achieved: the item is saved in the new owned collection.
