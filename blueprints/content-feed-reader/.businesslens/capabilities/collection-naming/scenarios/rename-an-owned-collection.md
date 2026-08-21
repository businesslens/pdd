---
kind: primary
routes:
  web: Web
steps:
  - text: The Product confirms collection ownership
    kind: product
    places:
      web: reader-web::personal-library::collection-workspace
  - text: The Reader provides the replacement name
    kind: actor
    actor: reader
    places:
      web: reader-web::personal-library::collection-workspace
  - text: The Product preserves the collection's items and order under the new name
    kind: product
    places:
      web: reader-web::personal-library::collection-workspace
---

# Rename an owned collection

## Trigger

The Reader changes the name of an owned collection.

## Outcome

The owned collection has the new name without losing its contents or publication state.
