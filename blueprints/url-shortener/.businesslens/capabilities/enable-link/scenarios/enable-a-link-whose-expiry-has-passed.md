---
kind: edge
routes:
  web: Web
steps:
  - text: The Owner chooses to enable a disabled link
    kind: actor
    actor: owner
    entities:
      - { entity: link, effect: reads, facts: [Slug, Expires at] }
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
  - text: The link's expiry passed while it was disabled
    kind: condition
    entities:
      - { entity: link, effect: reads, facts: [Expires at] }
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
  - text: The Product marks the link expired rather than active and says a later expiry would make it work again
    kind: product
    actor: owner
    entities:
      - { entity: link, effect: changes, from: Disabled, to: Expired, facts: [] }
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
---

# Enable a link whose expiry has passed

## Trigger

The Owner enables a disabled link after the expiry it was given has passed.

## Outcome

The link is no longer disabled but expired, its short address still shows
that it is unavailable, and the Owner knows a later expiry would bring it back.
