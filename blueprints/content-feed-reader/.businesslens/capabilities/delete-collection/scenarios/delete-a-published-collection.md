---
kind: edge
routes:
  web: Web
steps:
  - text: The Reader chooses to delete an owned collection that is published
    kind: actor
    actor: reader
    entities:
      - { entity: collection, effect: reads, facts: [Name, Public address] }
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
  - text: The Product asks the Reader to confirm, saying the collection is deleted for good and its public address will stop serving it
    kind: product
    actor: reader
    entities:
      - { entity: collection, effect: reads, facts: [Public address] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: The Reader confirms
    kind: actor
    actor: reader
    entities:
      - { entity: collection, effect: removes, from: Published }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: The former public address serves no contents, and every item it held is still saved
    kind: condition
    actor: reader
    entities:
      - { entity: item, effect: reads, facts: [ Saved at ] }
    contexts:
      web:
        place: reader-web::personal-library::saved-items
---

# Delete a published collection

## Trigger

The Reader no longer wants a collection they have published.

## Outcome

The collection is gone for good, its public address shows Visitors that it is
unavailable, and every item it held is still saved in the Reader's library.
