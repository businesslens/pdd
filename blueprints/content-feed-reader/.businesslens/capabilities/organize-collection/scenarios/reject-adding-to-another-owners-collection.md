---
kind: validation
routes:
  web: Web
steps:
  - text: The Reader attempts to change a collection owned by someone else.
    kind: actor
    actor: reader
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The Product checks collection ownership
    kind: product
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The attempted membership change is rejected
    kind: condition
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
---

# Reject adding to another owner's collection

## Trigger

The Reader attempts to change a collection owned by someone else.

## Outcome

The collection is unchanged and the Reader gains no editing authority.
