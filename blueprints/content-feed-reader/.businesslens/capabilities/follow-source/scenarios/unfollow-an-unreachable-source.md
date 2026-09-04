---
kind: edge
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Reader chooses to stop following a source that could not be read.
    kind: actor
    actor: reader
    entities:
      - { entity: source, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
  - text: The Product removes the source from the Reader's followed sources
    kind: product
    actor: reader
    entities:
      - { entity: source, effect: removes, from: Unreachable }
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
  - text: The Product stops trying to read that feed on its own schedule
    kind: condition
    entities: []
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
  - text: Existing library items and saved state are preserved
    kind: condition
    entities:
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
---

# Unfollow an unreachable source

## Trigger

The Reader gives up on a source the Product has not been able to read.

## Outcome

The Product stops retrying the source, it contributes no future items, and the
items it already contributed remain in the Reader's library.
