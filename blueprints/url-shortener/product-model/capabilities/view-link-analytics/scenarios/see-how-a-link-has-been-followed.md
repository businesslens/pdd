---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner opens a link from their links
    kind: actor
    actor: owner
    entities:
      - { entity: link, effect: reads, facts: [Slug, Destination] }
      - { entity: click, effect: reads, facts: [Clicked at] }
    contexts:
      web:
        place: shortener-web::dashboard::links
  - text: The Product presents the link's clicks over time, with the referring sites, countries and devices they came from
    kind: product
    actor: owner
    entities:
      - { entity: link, effect: reads, facts: [Slug] }
      - { entity: click, effect: reads, facts: [Clicked at, Referring site, Country, Device] }
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
  - text: Reading the analytics changes nothing about the link or its clicks
    kind: condition
    actor: owner
    entities:
      - { entity: link, effect: reads, facts: [] }
      - { entity: click, effect: reads, facts: [] }
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
---

# See how a link has been followed

## Trigger

The Owner wants to know whether a link they handed out is being followed, and
from where.

## Outcome

The Owner sees the link's clicks since it was created, over time and by
referring site, country and device.

## Edge cases

- Nobody has followed the link yet → its analytics show no clicks rather than an error.
- Clicks from before a change of destination → they stay in the link's analytics with the rest.
