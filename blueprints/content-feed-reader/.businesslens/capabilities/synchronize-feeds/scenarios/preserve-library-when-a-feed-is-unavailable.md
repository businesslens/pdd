---
kind: edge
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Reader refreshes their sources while one followed feed cannot be read.
    kind: actor
    actor: reader
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
  - text: The Product reports that the source could not be reached
    kind: product
    changes:
      - entity: source
        state: Unreachable
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
  - text: Existing items, reading state, saved state, and collections remain unchanged
    kind: condition
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
  - text: The source remains followed for a later refresh
    kind: condition
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
