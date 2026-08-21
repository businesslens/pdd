---
kind: validation
routes:
  web: Web
steps:
  - text: The Reader attempts to change the publication state of a collection owned by someone else.
    kind: actor
    actor: reader
    places:
      web: reader-web::personal-library::collection-workspace
  - text: The Product checks collection ownership
    kind: product
    places:
      web: reader-web::personal-library::collection-workspace
  - text: The attempted publication change is rejected
    kind: condition
    places:
      web: reader-web::personal-library::collection-workspace
---

# Reject publishing another owner's collection

## Trigger

The Reader attempts to change the publication state of a collection owned by someone else.

## Outcome

The collection's publication state is unchanged and the Reader gains no authority over it.
