---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Product's own polling schedule comes due for a followed source
    kind: condition
    unattended: true
    entities:
      - { entity: source, effect: reads }
  - text: The Product reads the followed feed on its own
    kind: product
    entities:
      - { entity: source, effect: reads }
  - text: Items the library does not already hold are collected
    kind: product
    entities:
      - { entity: item, effect: creates, to: Unread }
  - text: The newly collected items are waiting in the unread backlog at the next visit
    kind: product
    entities:
      - { entity: item, effect: reads }
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
---

# Collect on the Product's own schedule

## Trigger

The recurring schedule the Product owns comes due for a followed source, with no
Reader present.

## Outcome

New items from that source are in the Reader's unread backlog before they next
open it, and the library is unchanged if the feed could not be read.
