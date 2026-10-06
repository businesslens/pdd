---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner starts a new link
    kind: actor
    actor: owner
    entities:
      - { entity: link, effect: reads, facts: [] }
    contexts:
      web:
        place: shortener-web::dashboard::links
  - text: The Owner enters the destination and a slug of their own, and optionally sets an expiry
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: shortener-web::dashboard::new-link
  - text: The Product checks that the destination is a web address outside the shortener and that no link has the slug
    kind: product
    actor: owner
    entities:
      - { entity: link, effect: reads, facts: [Slug] }
    contexts:
      web:
        place: shortener-web::dashboard::new-link
  - text: The Product creates an active link with the chosen slug
    kind: product
    actor: owner
    entities:
      - { entity: link, effect: creates, to: Active, facts: [Slug, Destination, Expires at, Created at] }
    contexts:
      web:
        place: shortener-web::dashboard::new-link
  - text: The Product shows the new link's short address in place, ready to copy and hand out
    kind: product
    actor: owner
    entities:
      - { entity: link, effect: reads, facts: [Slug, Destination, Expires at] }
    contexts:
      web:
        place: shortener-web::dashboard::new-link
---

# Create a link with a custom slug

## Trigger

The Owner wants a short address that people can read, remember or type.

## Outcome

The Owner has an active link whose short address ends in the slug they chose,
and is looking at that address.

## Edge cases

- The slug uses characters a short address cannot carry → the link is not created, and the Product says which characters are allowed, keeping everything entered.
