---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Reader enters a term
    kind: actor
    actor: reader
    entities: []
    contexts:
      web:
        place: reader-web::personal-library::search
      mobile:
        place: reader-mobile::search
  - text: The Product finds the items, sources and collections in the Reader's library whose names match the term
    kind: product
    actor: reader
    entities:
      - { entity: item, effect: reads, facts: [Title] }
      - { entity: source, effect: reads, facts: [Name] }
      - { entity: collection, effect: reads, facts: [Name] }
    contexts:
      web:
        place: reader-web::personal-library::search
      mobile:
        place: reader-mobile::search
  - text: The Reader picks an item from what was found
    kind: actor
    actor: reader
    entities:
      - { entity: item, effect: reads, facts: [Title, Published at] }
    contexts:
      web:
        place: reader-web::personal-library::search
      mobile:
        place: reader-mobile::search
  - text: Nothing in the library changes by being found
    kind: condition
    entities:
      - { entity: item, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::search
      mobile:
        place: reader-mobile::search
---

# Search across the library

## Trigger

The Reader remembers something by name and wants it without knowing whether it
is an item, a source, or a collection.

## Outcome

The Reader has what they were looking for in front of them, found from one
term, with nothing in the library changed.

## Edge cases

- Nothing matches the term → the Reader is told that the library holds no match, and the term stays available to change.
- The term matches a source and items from it → both are found, and picking the source shows the source rather than an item.
