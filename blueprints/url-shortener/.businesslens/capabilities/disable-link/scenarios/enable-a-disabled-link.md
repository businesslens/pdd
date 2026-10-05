---
kind: primary
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
  - text: The link has no expiry, or its expiry is still to come
    kind: condition
    entities:
      - { entity: link, effect: reads, facts: [Expires at] }
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
  - text: The Product makes the link active again
    kind: product
    actor: owner
    entities:
      - { entity: link, effect: changes, from: Disabled, to: Active, facts: [] }
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
---

# Enable a disabled link

## Trigger

The Owner wants a short address they disabled to work again.

## Outcome

The same short address sends Visitors to the link's destination again.
