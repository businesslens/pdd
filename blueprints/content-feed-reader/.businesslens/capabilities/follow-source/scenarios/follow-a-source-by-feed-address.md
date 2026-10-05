---
kind: primary
routes:
  web: Web
  mobile: Mobile
  mobile-source-focused: Mobile — source-focused
steps:
  - text: The Reader starts following a new feed
    kind: actor
    actor: reader
    entities: []
    contexts:
      web:
        place: reader-web::personal-library::add-source
      mobile:
        place: reader-mobile::personal-library::source-list
      mobile-source-focused:
        place: reader-mobile::source-focused-library::source-list
  - text: The Reader enters the address of a readable syndicated feed
    kind: actor
    actor: reader
    entities: []
    contexts:
      web:
        place: reader-web::personal-library::add-source
      mobile:
        place: reader-mobile::personal-library::source-list
      mobile-source-focused:
        place: reader-mobile::source-focused-library::source-list
  - text: The Product validates that the address returns a supported feed
    kind: product
    entities: []
    contexts:
      web:
        place: reader-web::personal-library::add-source
      mobile:
        place: reader-mobile::personal-library::source-list
      mobile-source-focused:
        place: reader-mobile::source-focused-library::source-list
  - text: The Product shows the name the feed gives itself and the address it will be read from
    kind: product
    actor: reader
    entities:
      - { entity: source, effect: reads, facts: [ Name, Feed address ] }
    contexts:
      web:
        place: reader-web::personal-library::add-source
      mobile:
        place: reader-mobile::personal-library::source-list
      mobile-source-focused:
        place: reader-mobile::source-focused-library::source-list
  - text: The Reader confirms that this is the feed they meant
    kind: actor
    actor: reader
    entities: []
    contexts:
      web:
        place: reader-web::personal-library::add-source
      mobile:
        place: reader-mobile::personal-library::source-list
      mobile-source-focused:
        place: reader-mobile::source-focused-library::source-list
  - text: The source is added to the Reader's followed sources
    kind: product
    actor: reader
    entities:
      - { entity: source, effect: creates, to: Reachable, facts: [ Name, Feed address, Last read ] }
    contexts:
      web:
        place: reader-web::personal-library::add-source
      mobile:
        place: reader-mobile::personal-library::source-list
      mobile-source-focused:
        place: reader-mobile::source-focused-library::source-list
---

# Follow a source by feed address

## Trigger

The Reader has the address of a readable syndicated feed they want in their
library.

## Outcome

The source is followed and future synchronization may add its items to the Reader's library.
