---
kind: primary
result: achieved
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
  - text: The Product collects the items the feed currently offers and takes the Reader to them
    kind: product
    actor: reader
    capability: follow-source
    entities:
      - { entity: item, effect: creates, to: Unread, facts: [ Title, Published at ] }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
      mobile-source-focused:
        place: reader-mobile::source-focused-library::source-backlog
  - text: The Reader opens one of the new source's items and reads it
    kind: actor
    actor: reader
    capability: read-content
    entities:
      - { entity: item, effect: reads, facts: [ Title, Published at ] }
      - { entity: source, effect: reads, facts: [ Name ] }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
      mobile-source-focused:
        place: reader-mobile::source-focused-library::source-backlog
routes:
  web: Web
  mobile: Mobile
  mobile-source-focused: Mobile — source-focused
---

# Read the first items from a new source

## Trigger

The Reader has found a feed they want to follow and read.

## Outcome

The Journey goal is achieved: the source is followed, its current items are in
the Reader's unread backlog, and the Reader is reading one of them.
