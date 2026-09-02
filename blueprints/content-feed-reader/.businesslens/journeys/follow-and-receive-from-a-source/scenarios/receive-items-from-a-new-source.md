---
kind: primary
result: achieved
steps:
  - text: The Reader submits the feed address and follows the validated source
    kind: actor
    actor: reader
    capability: follow-source
    entities:
      - { entity: source, effect: creates, to: Reachable }
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
  - text: The Reader refreshes their followed sources
    kind: actor
    actor: reader
    capability: synchronize-feeds
    entities:
      - { entity: source, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
  - text: The Product reads the followed feed and collects its available new items
    kind: product
    actor: reader
    capability: synchronize-feeds
    entities:
      - { entity: source, effect: reads }
      - { entity: item, effect: creates, to: Unread }
  - text: The new items enter the Reader's private library
    kind: condition
    actor: reader
    entities:
      - { entity: item, effect: reads }
routes:
  web: Web
  mobile: Mobile
---

# Receive items from a new source

## Trigger

The Reader chooses a valid feed that they want to follow.

## Outcome

The Journey goal is achieved: the source is followed and its available new
items are present in the Reader's library.
