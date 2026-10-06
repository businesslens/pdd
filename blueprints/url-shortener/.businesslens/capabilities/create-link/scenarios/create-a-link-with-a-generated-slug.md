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
  - text: The Owner enters the destination, leaves the slug for the Product to choose, and optionally sets an expiry
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: shortener-web::dashboard::new-link
  - text: The Product checks that the destination is a web address outside the shortener
    kind: product
    actor: owner
    entities: []
    contexts:
      web:
        place: shortener-web::dashboard::new-link
  - text: The Product creates an active link with a slug no other link has ever had
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

# Create a link with a generated slug

## Trigger

The Owner has a long address they want to hand out and has no preference for
the slug.

## Outcome

The Owner has an active link with a short, unique generated slug that sends
Visitors to the destination, and is looking at its short address.

## Edge cases

- The Owner sets an expiry that has already passed → the link is not created, and the Product asks for a later one with everything entered kept.
