---
kind: edge
result: not-achieved
routes:
  web: Web
steps:
  - text: The Owner creates a link and hands out its short address
    kind: actor
    actor: owner
    capability: create-link
    entities:
      - { entity: link, effect: creates, to: Active, facts: [Slug, Destination, Expires at, Created at] }
    contexts:
      web:
        place: shortener-web::dashboard::new-link
  - text: The Owner disables the link
    kind: actor
    actor: owner
    capability: disable-link
    entities:
      - { entity: link, effect: changes, from: Active, to: Disabled, facts: [] }
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
  - text: The Product shows that the link is unavailable and sends nobody on
    kind: product
    actor: visitor
    capability: follow-link
    entities:
      - { entity: link, effect: reads, facts: [] }
    contexts:
      web:
        place: shortener-web::redirect
---

# Share a link the Owner has disabled

## Trigger

The Owner hands out a short address and then disables the link before a
Visitor follows it.

## Outcome

The Journey goal is not achieved: the Visitor is told the link is unavailable
and does not reach the destination. Disabling stays authoritative over an
address already handed out, and the link's analytics are unchanged.
