---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Reader chooses to stop following an existing source.
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
      - { entity: source, effect: removes, from: Reachable }
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
  - text: Future synchronization no longer collects items from that source
    kind: condition
    entities:
      - { entity: item, effect: reads }
      - { entity: source, effect: reads }
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

# Unfollow a source

## Trigger

The Reader chooses to stop following an existing source.

## Outcome

The source contributes no future items and the Reader's existing library history remains intact.
