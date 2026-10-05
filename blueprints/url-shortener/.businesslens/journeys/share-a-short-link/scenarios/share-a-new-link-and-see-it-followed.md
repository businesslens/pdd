---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Owner creates a link to the destination they want to hand out
    kind: actor
    actor: owner
    capability: create-link
    entities:
      - { entity: link, effect: creates, to: Active, facts: [Slug, Destination, Expires at, Created at] }
    contexts:
      web:
        place: shortener-web::dashboard::new-link
  - text: The Product opens the new link with its short address, which the Owner hands out
    kind: product
    actor: owner
    capability: create-link
    entities:
      - { entity: link, effect: reads, facts: [Slug, Destination, Expires at] }
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
  - text: A Visitor follows the short address
    kind: actor
    actor: visitor
    capability: follow-link
    entities: []
    contexts:
      web:
        place: shortener-web::redirect
  - text: The Product records a click and sends the Visitor on to the destination
    kind: product
    actor: visitor
    capability: follow-link
    entities:
      - { entity: click, effect: creates, facts: [Clicked at, Referring site, Country, Device] }
      - { entity: link, effect: reads, facts: [Destination] }
    contexts:
      web:
        place: shortener-web::redirect
  - text: The Owner reads the link's analytics and sees the click with where it came from
    kind: actor
    actor: owner
    capability: view-link-analytics
    entities:
      - { entity: link, effect: reads, facts: [Slug] }
      - { entity: click, effect: reads, facts: [Clicked at, Referring site, Country, Device] }
    contexts:
      web:
        place: shortener-web::dashboard::link-detail
---

# Share a new link and see it followed

## Trigger

The Owner has a long address to hand out and wants to know whether people
follow it.

## Outcome

The Journey goal is achieved: the Visitor reached the destination through the
short address, and the Owner sees the click in the link's analytics without
learning who made it.
