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
    contexts:
      web:
        place: shortener-web::dashboard::links
  - text: The Owner enters a new destination
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
  - text: The Product checks that the new destination is a web address outside the shortener
    kind: product
    actor: owner
    entities: []
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
  - text: The Owner saves the change
    kind: actor
    actor: owner
    entities:
      - { entity: link, effect: changes, facts: [Destination] }
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
  - text: The link keeps its slug and the clicks it has already received
    kind: condition
    actor: owner
    entities:
      - { entity: link, effect: reads, facts: [Slug] }
      - { entity: click, effect: reads, facts: [] }
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
---

# Change a link's destination

## Trigger

The address a short link leads to has moved, or the Owner wants it to lead
somewhere else.

## Outcome

Following the same short address now sends Visitors to the new destination,
and the link's earlier clicks are still in its analytics.

## Edge cases

- The new destination is not a web address or is a short address of this Product → nothing is saved, and the Product explains why with the entry kept.
