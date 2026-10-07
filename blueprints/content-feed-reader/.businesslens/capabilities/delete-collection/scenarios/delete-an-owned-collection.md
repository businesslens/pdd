---
kind: primary
routes:
  web: Web
steps:
  - text: The Reader chooses to delete an owned collection
    kind: actor
    actor: reader
    entities:
      - { entity: collection, effect: reads, facts: [Name] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: The Product confirms collection ownership
    kind: product
    actor: reader
    entities:
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: The Product asks the Reader to confirm, saying the collection is deleted for good and its items stay saved
    kind: product
    actor: reader
    entities:
      - { entity: collection, effect: reads, facts: [Name] }
      - { entity: item, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: The Reader confirms
    kind: actor
    actor: reader
    entities:
      - { entity: collection, effect: removes, from: Private }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: Every item it held is still saved, with its reading state unchanged
    kind: condition
    actor: reader
    entities:
      - { entity: item, effect: reads, facts: [ Saved at ] }
    contexts:
      web:
        place: reader-web::personal-library::saved-items
---

# Delete an owned collection

## Trigger

The Reader no longer wants one of their private collections.

## Outcome

The collection is gone for good, and every item it held is still saved in the
Reader's library.

## Edge cases

- The Reader declines to confirm → the collection stays exactly as it was.
- The collection was unpublished earlier → it is deleted the same way, and its former public address keeps serving nothing.
