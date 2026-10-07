---
kind: edge
result: not-achieved
steps:
  - text: The Reader enters the feed address and confirms the source the Product found
    kind: actor
    actor: reader
    capability: follow-source
    entities:
      - { entity: source, effect: creates, to: Reachable, facts: [ Name, Feed address, Last read ] }
    contexts:
      web:
        place: reader-web::personal-library::add-source
      mobile:
        place: reader-mobile::personal-library::source-list
      mobile-source-focused:
        place: reader-mobile::source-focused-library::source-list
  - text: The Product finds no items in the feed and takes the Reader to the new source's empty unread items
    kind: product
    actor: reader
    capability: follow-source
    entities:
      - { entity: source, effect: reads, facts: [ Name ] }
      - { entity: item, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
      mobile-source-focused:
        place: reader-mobile::source-focused-library::source-backlog
  - text: The Reader refreshes their followed sources
    kind: actor
    actor: reader
    capability: synchronize-feeds
    entities:
      - { entity: source, effect: reads, facts: [] }
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
      mobile-source-focused:
        place: reader-mobile::source-focused-library::source-list
  - text: The feed still offers nothing the library does not already hold
    kind: condition
    entities:
      - { entity: item, effect: reads, facts: [] }
routes:
  web: Web
  mobile: Mobile
  mobile-source-focused: Mobile — source-focused
---

# Follow a source with nothing published yet

## Trigger

The Reader follows a feed that has not published anything yet.

## Outcome

The Journey goal is not achieved: the source is followed, but there is nothing
from it to read until it publishes. The Reader's library is otherwise
unchanged.
