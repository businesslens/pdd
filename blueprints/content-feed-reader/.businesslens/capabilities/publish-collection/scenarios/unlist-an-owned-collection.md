---
kind: edge
routes:
  web: Web
steps:
  - text: The Product confirms ownership
    kind: product
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The Product explains that the public link will stop working
    kind: product
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The Reader confirms unlisting
    kind: actor
    changes:
      - entity: collection
        state: Unlisted
    actor: reader
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
---

# Unlist an owned collection

## Trigger

The Reader revokes public access to an owned published collection.

## Outcome

The collection is private and its former public address serves no contents.
