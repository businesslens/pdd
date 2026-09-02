---
kind: primary
routes:
  web: Web
steps:
  - text: The Reader moves a saved item from one owned collection to another.
    kind: actor
    actor: reader
    entities:
      - { entity: collection, as: source, effect: reads }
      - { entity: collection, as: target, effect: reads }
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The Product confirms that the Reader owns both collections
    kind: product
    actor: reader
    entities:
      - { entity: collection, as: source, effect: reads }
      - { entity: collection, as: target, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The item leaves the first collection and joins the second at the chosen position
    kind: product
    actor: reader
    entities:
      - { entity: collection, as: source }
      - { entity: collection, as: target }
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The item's saved state and reading state are untouched
    kind: condition
    entities:
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
---

# Move an item between collections

## Trigger

The Reader decides a saved item belongs in a different one of their
collections.

## Outcome

The item is in the second collection and no longer in the first, and nothing
about the item itself has changed.
