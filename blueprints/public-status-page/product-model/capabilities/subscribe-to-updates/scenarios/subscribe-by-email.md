---
kind: primary
routes:
  web: Web
steps:
  - text: The Visitor enters an email address
    kind: actor
    actor: visitor
    entities: []
    contexts:
      web:
        place: status-web::public-page::subscribe
  - text: The Product records a pending subscription and emails a confirmation link to the address
    kind: product
    actor: visitor
    entities:
      - { entity: subscription, effect: creates, to: Pending, facts: [Email address, Subscribed at] }
    contexts:
      web:
        place: status-web::public-page::subscribe
  - text: The Visitor follows the confirmation link
    kind: actor
    actor: visitor
    entities:
      - { entity: subscription, from: Pending, to: Confirmed, facts: [] }
    contexts:
      web:
        place: status-web::public-page::subscribe
  - text: The Product confirms that the address will receive updates
    kind: product
    actor: visitor
    entities:
      - { entity: subscription, effect: reads, facts: [Email address] }
    contexts:
      web:
        place: status-web::public-page::subscribe
---

# Subscribe by email

## Trigger

A Visitor wants to hear about incidents and maintenance without checking the page.

## Outcome

The subscription is confirmed and the address receives every update posted from then on.

## Edge cases

- The address is already subscribed → no second subscription is created, and the Visitor sees the same message as for a new one.
- The confirmation link is never followed → the subscription stays pending and receives nothing.
