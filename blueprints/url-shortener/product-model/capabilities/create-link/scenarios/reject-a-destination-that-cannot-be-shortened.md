---
kind: validation
routes:
  web: Web
steps:
  - text: The Owner enters a destination that is not a web address, or is itself a short address of this Product
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: shortener-web::dashboard::new-link
  - text: The Product finds the destination cannot be shortened
    kind: condition
    entities: []
    contexts:
      web:
        place: shortener-web::dashboard::new-link
  - text: The Product explains why and keeps what was entered to correct
    kind: product
    actor: owner
    entities: []
    contexts:
      web:
        place: shortener-web::dashboard::new-link
---

# Reject a destination that cannot be shortened

## Trigger

The Owner enters a destination that is not a web address or that points back
into the shortener.

## Outcome

No link is created, the Owner knows why, and the destination they entered
remains available to correct.
