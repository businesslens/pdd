---
kind: edge
routes:
  web: Web
steps:
  - text: The Visitor follows a short address
    kind: actor
    actor: visitor
    entities: []
    contexts:
      web:
        place: shortener-web::redirect
  - text: The link with that slug is disabled or has expired
    kind: condition
    entities:
      - { entity: link, effect: reads, facts: [Slug] }
    contexts:
      web:
        place: shortener-web::redirect
  - text: The Product shows that the link is unavailable, without revealing where it led or whose it is
    kind: product
    actor: visitor
    entities:
      - { entity: link, effect: reads, facts: [] }
    contexts:
      web:
        place: shortener-web::redirect
  - text: Nobody is sent on, and the link's analytics stay as they were
    kind: condition
    entities:
      - { entity: link, effect: reads, facts: [] }
    contexts:
      web:
        place: shortener-web::redirect
---

# Follow a link that no longer redirects

## Trigger

A Visitor opens a short address whose link its Owner has disabled or that has
expired.

## Outcome

The Visitor is told the link is unavailable and is not sent anywhere; nothing
about the link is revealed and its analytics are unchanged.

## Edge cases

- No link has the slug in the address → the Visitor sees the same unavailable statement, so a mistyped address and a switched-off link look alike.
