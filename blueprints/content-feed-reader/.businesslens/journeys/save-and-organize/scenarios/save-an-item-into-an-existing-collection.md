---
kind: edge
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
  - text: The Reader selects an owned collection
    kind: actor
    actor: reader
    capability: organize-collection
    entities:
      - { entity: collection, effect: reads, facts: [ Name ] }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
      mobile-to-web:
        place: reader-web::personal-library::collection-workspace
      mobile-to-web-source-focused:
        place: reader-web::personal-library::collection-workspace
  - text: The saved item is added at the chosen position
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

# Save an item into an existing collection

## Trigger

The Reader finds a worthwhile item for an existing owned collection.

## Outcome

The Journey goal is achieved: the item is saved in the intended owned collection.
