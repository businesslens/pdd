---
kind: validation
routes:
  web: Web
steps:
  - text: The Visitor enters something that is not an email address
    kind: actor
    actor: visitor
    entities: []
    contexts:
      web:
        place: status-web::public-page::subscribe
  - text: The Product explains that it needs a valid email address and keeps what was entered
    kind: product
    actor: visitor
    entities: []
    contexts:
      web:
        place: status-web::public-page::subscribe
  - text: No subscription is recorded
    kind: condition
    entities:
      - { entity: subscription, effect: reads, facts: [] }
    contexts:
      web:
        place: status-web::public-page::subscribe
---

# Refuse an invalid email address

## Trigger

A Visitor subscribes with text that cannot be an email address.

## Outcome

Nothing is recorded or sent, and the Visitor can correct the address.
