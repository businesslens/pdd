---
kind: primary
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
  - text: The Product finds the active link with that slug
    kind: product
    actor: visitor
    entities:
      - { entity: link, effect: reads, facts: [Slug] }
    contexts:
      web:
        place: shortener-web::redirect
  - text: The Product records a click with when it happened and the referring site, country and device it came from
    kind: product
    actor: visitor
    entities:
      - { entity: click, effect: creates, facts: [Clicked at, Referring site, Country, Device] }
    contexts:
      web:
        place: shortener-web::redirect
  - text: The Product sends the Visitor on to the link's destination
    kind: product
    actor: visitor
    entities:
      - { entity: link, effect: reads, facts: [Destination] }
    contexts:
      web:
        place: shortener-web::redirect
---

# Follow an active link

## Trigger

A Visitor opens a short address from a post, a message, a printed page or
anywhere else it was handed out.

## Outcome

The Visitor arrives at the destination, and the link's Owner can see one more
click in its analytics.
