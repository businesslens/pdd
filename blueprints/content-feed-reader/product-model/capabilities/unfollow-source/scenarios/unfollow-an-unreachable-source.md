---
kind: edge
routes:
  web: Web
  mobile: Mobile
  mobile-source-focused: Mobile — source-focused
steps:
  - text: The Reader chooses to stop following a source that could not be read
    kind: actor
    actor: reader
    entities:
      - { entity: source, effect: reads, facts: [ Name, Last read ] }
    contexts:
      web:
        place: reader-web::personal-library::source-detail
      mobile:
        place: reader-mobile::personal-library::source-list
      mobile-source-focused:
        place: reader-mobile::source-focused-library::source-list
  - text: The Product asks the Reader to confirm, and says that the items already collected from the source will stay in the library
    kind: product
    actor: reader
    entities:
      - { entity: source, effect: reads, facts: [] }
      - { entity: item, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::source-detail
      mobile:
        place: reader-mobile::personal-library::source-list
      mobile-source-focused:
        place: reader-mobile::source-focused-library::source-list
  - text: The Reader confirms
    kind: actor
    actor: reader
    entities:
      - { entity: source, effect: removes, from: Unreachable }
    contexts:
      web:
        place: reader-web::personal-library::source-detail
      mobile:
        place: reader-mobile::personal-library::source-list
      mobile-source-focused:
        place: reader-mobile::source-focused-library::source-list
  - text: The Product stops trying to read that feed on its own schedule
    kind: condition
    entities: []
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
      mobile-source-focused:
        place: reader-mobile::source-focused-library::source-list
  - text: Existing library items and saved state are preserved
    kind: condition
    entities:
      - { entity: item, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
      mobile-source-focused:
        place: reader-mobile::source-focused-library::source-list
---

# Unfollow an unreachable source

## Trigger

The Reader gives up on a source the Product has not been able to read.

## Outcome

The Product stops retrying the source, it contributes no future items, and the
items it already contributed remain in the Reader's library.
