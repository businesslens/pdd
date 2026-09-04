---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Reader refreshes their followed sources.
    kind: actor
    actor: reader
    entities:
      - { entity: source, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
  - text: The Product reads each followed feed
    kind: product
    entities:
      - { entity: source, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
  - text: Items the Reader's library does not already hold are collected
    kind: product
    actor: reader
    entities:
      - { entity: item, effect: creates, to: Unread }
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
  - text: The newly collected items enter the Reader's unread backlog
    kind: product
    actor: reader
    entities:
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
---

# Collect new items from a followed source

## Trigger

The Reader refreshes their followed sources.

## Outcome

New feed items are available in the Reader's private library without duplicates.
