---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner chooses a period on a link's analytics
    kind: actor
    actor: owner
    entities:
      - { entity: link, effect: reads, facts: [Slug] }
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
  - text: The Product presents only the clicks from that period, over time and by referring site, country and device
    kind: product
    actor: owner
    entities:
      - { entity: click, effect: reads, facts: [Clicked at, Referring site, Country, Device] }
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
---

# Narrow analytics to a period

## Trigger

The Owner wants to see how a link did during a particular stretch of time,
such as the week of a campaign.

## Outcome

The Owner sees the link's clicks from the chosen period only, and every click
outside it is still kept.
