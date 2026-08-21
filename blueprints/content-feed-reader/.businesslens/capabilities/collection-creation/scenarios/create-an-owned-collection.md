---
kind: primary
routes:
  web: Web
steps:
  - text: The Reader provides a collection name
    kind: actor
    actor: reader
    places:
      web: reader-web::personal-library::collection-workspace
  - text: The Product creates a private collection owned by that Reader
    kind: product
    places:
      web: reader-web::personal-library::collection-workspace
  - text: The empty collection is ready to edit
    kind: condition
    places:
      web: reader-web::personal-library::collection-workspace
---

# Create an owned collection

## Trigger

The Reader chooses to organize saved items in a new collection.

## Outcome

The Reader has a new private owned collection with the chosen name.
