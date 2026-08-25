---
kind: primary
routes:
  web: Web
steps:
  - text: The Product confirms ownership
    kind: product
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The Product explains that the collection will become readable by link
    kind: product
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: The Reader confirms publication
    kind: actor
    actor: reader
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
  - text: A stable public web address is created
    kind: condition
    contexts:
      web:
        place: reader-web::personal-library::collection-workspace
---

# Publish an owned collection

## Trigger

The Reader chooses to publish a private owned collection.

## Outcome

The owned collection is publicly readable at the stable web address.
