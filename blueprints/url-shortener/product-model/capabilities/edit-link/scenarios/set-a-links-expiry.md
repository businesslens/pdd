---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner picks when an active link should stop redirecting
    kind: actor
    actor: owner
    entities:
      - { entity: link, effect: reads, facts: [Expires at] }
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
  - text: The Product checks that the chosen time is still to come
    kind: product
    actor: owner
    entities: []
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
  - text: The Owner saves the expiry
    kind: actor
    actor: owner
    entities:
      - { entity: link, effect: changes, facts: [Expires at] }
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
---

# Set a link's expiry

## Trigger

The Owner wants a link to stop working on its own at a known time, such as the
end of a campaign.

## Outcome

The link stays active until the chosen time and then expires without the
Owner doing anything more.

## Edge cases

- The Owner removes an existing expiry → the link stays active until they disable it.
- The chosen time has already passed → nothing is saved, and the Product asks for a later one.
