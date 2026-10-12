---
kind: validation
routes:
  web: Web
steps:
  - text: The Owner enters a destination and a slug of their own
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: shortener-web::dashboard::new-link
  - text: The Product finds that a link already has that slug
    kind: condition
    entities:
      - { entity: link, effect: reads, facts: [Slug] }
    contexts:
      web:
        place: shortener-web::dashboard::new-link
  - text: The Product says the slug is taken and keeps the destination and slug to change
    kind: product
    actor: owner
    entities: []
    contexts:
      web:
        place: shortener-web::dashboard::new-link
---

# Reject a slug already in use

## Trigger

The Owner chooses a slug that another link already has.

## Outcome

No link is created, the existing link with that slug is untouched, and the
Owner can pick another slug without entering the destination again.

## Edge cases

- The slug belongs to a disabled or expired link, the Owner's own included → it is still taken.
