---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner enters part of a slug or a destination
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: shortener-web::dashboard::links
  - text: The Product lists the Owner's links whose slug or destination contains it, active, disabled and expired alike, each marked with its state
    kind: product
    actor: owner
    entities:
      - { entity: link, effect: reads, facts: [Slug, Destination, Created at, Expires at] }
    contexts:
      web:
        place: shortener-web::dashboard::links
  - text: The Owner opens one of the links found
    kind: actor
    actor: owner
    entities:
      - { entity: link, effect: reads, facts: [Slug, Destination] }
    contexts:
      web:
        place: shortener-web::dashboard::links
  - text: The Product shows that link in full
    kind: product
    actor: owner
    entities:
      - { entity: link, effect: reads, facts: [Slug, Destination, Created at, Expires at] }
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
---

# Find a link by slug or destination

## Trigger

The Owner wants a link they made earlier and remembers part of its short
address or of where it leads.

## Outcome

The Owner is looking at the link they wanted, found from what they remembered,
with nothing about any link changed.

## Edge cases

- Nothing matches → the Product says no link matches, and the entry stays available to change.
