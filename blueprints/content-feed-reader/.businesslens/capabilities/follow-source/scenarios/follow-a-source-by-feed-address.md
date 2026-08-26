---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Reader submits the address of a readable syndicated feed.
    kind: actor
    actor: reader
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
  - text: The Product validates that the address returns a supported feed
    kind: product
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
  - text: The source is added to the Reader's followed sources
    kind: product
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
---

# Follow a source by feed address

## Trigger

The Reader submits the address of a readable syndicated feed.

## Outcome

The source is followed and future synchronization may add its items to the Reader's library.
