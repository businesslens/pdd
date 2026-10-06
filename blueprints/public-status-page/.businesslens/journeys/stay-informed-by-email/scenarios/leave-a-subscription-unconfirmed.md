---
kind: edge
result: not-achieved
routes:
  web: Web
steps:
  - text: The Visitor subscribes with an email address
    kind: actor
    actor: visitor
    capability: subscribe-to-updates
    entities:
      - { entity: subscription, effect: creates, to: Pending, facts: [Email address, Subscribed at] }
    contexts:
      web:
        place: status-web::public-page::subscribe
  - text: The confirmation link is never followed
    kind: condition
    entities:
      - { entity: subscription, effect: reads, facts: [] }
  - text: An Operator posts an incident update
    kind: actor
    actor: operator
    capability: post-incident-update
    entities:
      - { entity: incident-update, effect: creates, facts: [Message, Incident status, Posted at] }
    contexts:
      web:
        place: status-web::operator-console::incident-workspace
  - text: The pending subscription is not emailed
    kind: condition
    entities:
      - { entity: subscription, effect: reads, facts: [] }
---

# Leave a subscription unconfirmed

## Trigger

A Visitor subscribes but never confirms the address.

## Outcome

The Journey goal is not achieved: the address receives nothing but its confirmation link, and the Visitor learns of the update only by opening the page.
