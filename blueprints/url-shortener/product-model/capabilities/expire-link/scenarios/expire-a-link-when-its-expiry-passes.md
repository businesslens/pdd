---
kind: primary
routes:
  web: Web
steps:
  - text: The expiry of an active link passes
    kind: condition
    unattended: true
    entities:
      - { entity: link, effect: reads, facts: [Expires at] }
  - text: The Product expires the link
    kind: product
    entities:
      - { entity: link, effect: changes, from: Active, to: Expired, facts: [] }
  - text: The link appears as expired in the list of links
    kind: condition
    entities:
      - { entity: link, effect: reads, facts: [Slug, Expires at] }
    contexts:
      web:
        place: shortener-web::dashboard::links
---

# Expire a link when its expiry passes

## Trigger

The expiry an Owner set on an active link passes, with nobody present.

## Outcome

The link is expired: its short address shows that the link is unavailable, and
the Owner sees it marked expired among their links.

## Edge cases

- The link is disabled when its expiry passes → it stays disabled; enabling it later finds it expired.
