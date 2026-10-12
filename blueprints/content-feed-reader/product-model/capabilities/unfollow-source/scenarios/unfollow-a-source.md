---
kind: primary
routes:
  web: Web
  mobile: Mobile
  mobile-source-focused: Mobile — source-focused
steps:
  - text: The Reader chooses to stop following an existing source
    kind: actor
    actor: reader
    entities:
      - { entity: source, effect: reads, facts: [ Name ] }
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
      - { entity: source, effect: removes, from: Reachable }
    contexts:
      web:
        place: reader-web::personal-library::source-detail
      mobile:
        place: reader-mobile::personal-library::source-list
      mobile-source-focused:
        place: reader-mobile::source-focused-library::source-list
  - text: Future synchronization no longer collects items from that source
    kind: condition
    entities:
      - { entity: item, effect: reads, facts: [] }
      - { entity: source, effect: reads, facts: [] }
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

# Unfollow a source

## Trigger

The Reader chooses to stop following an existing source.

## Outcome

The source contributes no future items and the Reader's existing library history remains intact.

## Edge cases

- The Reader declines to confirm → the source stays followed and nothing changes.
