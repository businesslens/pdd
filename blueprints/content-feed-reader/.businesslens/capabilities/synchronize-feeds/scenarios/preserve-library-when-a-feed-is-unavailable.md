---
kind: edge
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Reader refreshes their sources while one followed feed cannot be read.
    kind: actor
    actor: reader
    entities:
      - { entity: source, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
  - text: The Product reports that the source could not be reached
    kind: product
    entities:
      - { entity: source, from: Reachable, to: Unreachable }
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
  - text: Existing items, reading state, saved state, and collections remain unchanged
    kind: condition
    actor: reader
    entities:
      - { entity: collection, effect: reads }
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
  - text: The source remains followed for a later refresh
    kind: condition
    entities:
      - { entity: source, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
---

# Preserve the library when a feed is unavailable

## Trigger

The Reader refreshes their sources while one followed feed cannot be read.

## Outcome

A temporary feed failure does not erase library history or silently unfollow the source.
