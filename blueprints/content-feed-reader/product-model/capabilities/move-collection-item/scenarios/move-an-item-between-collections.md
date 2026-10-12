---
kind: primary
routes:
  web: Web
steps:
  - text: The Reader moves a saved item from one owned collection to another.
    kind: actor
    actor: reader
    entities:
      - { entity: collection, as: source, effect: reads, facts: [Name] }
      - { entity: collection, as: target, effect: reads, facts: [Name] }
      - { entity: item, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: The Product confirms that the Reader owns both collections
    kind: product
    actor: reader
    entities:
      - { entity: collection, as: source, effect: reads, facts: [] }
      - { entity: collection, as: target, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: The item leaves the first collection and joins the second at the chosen position
    kind: product
    actor: reader
    entities:
      - { entity: collection, as: source, facts: [Item order] }
      - { entity: collection, as: target, facts: [Item order] }
      - { entity: item, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
  - text: The item's saved state and reading state are untouched
    kind: condition
    entities:
      - { entity: item, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::collection-detail
---

# Move an item between collections

## Trigger

The Reader decides a saved item belongs in a different one of their
collections.

## Outcome

The item is in the second collection and no longer in the first, and nothing
about the item itself has changed.
