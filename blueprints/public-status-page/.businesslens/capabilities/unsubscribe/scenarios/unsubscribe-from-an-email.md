---
kind: primary
routes:
  web: Web
steps:
  - text: The Visitor follows the unsubscribe link in an update email
    kind: actor
    actor: visitor
    entities: []
    contexts:
      web:
        place: status-web::public-page::unsubscribe
  - text: The Product names the address that will stop receiving updates
    kind: product
    actor: visitor
    entities:
      - { entity: subscription, effect: reads, facts: [Email address] }
    contexts:
      web:
        place: status-web::public-page::unsubscribe
  - text: The Visitor confirms
    kind: actor
    actor: visitor
    entities:
      - { entity: subscription, effect: removes, from: Confirmed }
    contexts:
      web:
        place: status-web::public-page::unsubscribe
  - text: The Product confirms that no more updates will be sent
    kind: product
    actor: visitor
    entities: []
    contexts:
      web:
        place: status-web::public-page::unsubscribe
---

# Unsubscribe from an email

## Trigger

A subscriber no longer wants the page's emails.

## Outcome

The subscription is gone and the address receives nothing more.

## Edge cases

- The link belongs to a subscription that no longer exists → the Visitor is told the address is not subscribed, and nothing changes.
