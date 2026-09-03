---
kind: edge
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Product's own polling schedule comes due for a followed source that could not be read last time
    kind: condition
    unattended: true
    entities:
      - { entity: source, effect: reads }
  - text: The Product reads the feed successfully
    kind: product
    entities:
      - { entity: source, from: Unreachable, to: Reachable }
  - text: Items the library does not already hold are collected
    kind: product
    entities:
      - { entity: item, effect: creates, to: Unread }
  - text: The source is shown as reachable again at the next visit
    kind: product
    entities:
      - { entity: source, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
---

# Read an unreachable source again on schedule

## Trigger

The recurring schedule the Product owns comes due for a followed source whose
feed could not be read on the most recent attempt, with no Reader present.

## Outcome

The source is reachable again, whatever it published meanwhile is in the unread
backlog before the Reader next opens it, and nothing was needed from the Reader
to get there.
