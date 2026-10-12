---
kind: edge
routes:
  web: Web
steps:
  - text: The Owner opens a link that has expired
    kind: actor
    actor: owner
    entities:
      - { entity: link, effect: reads, facts: [Slug, Expires at] }
    contexts:
      web:
        place: shortener-web::dashboard::links
  - text: The Owner sets a later expiry, or removes the expiry
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
  - text: The Owner saves, and the link is active again
    kind: actor
    actor: owner
    entities:
      - { entity: link, effect: changes, from: Expired, to: Active, facts: [Expires at] }
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
---

# Give an expired link a new expiry

## Trigger

The Owner wants a link that has expired to work again.

## Outcome

The same short address sends Visitors to the destination again until the new
expiry, or indefinitely when the expiry was removed.
