---
kind: validation
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Reader submits an address that does not return a supported feed.
    kind: actor
    actor: reader
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
  - text: The Product inspects the submitted address
    kind: product
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
  - text: No supported feed is found
    kind: condition
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
  - text: The Product explains that the address cannot be followed
    kind: product
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
---

# Reject an address with no readable feed

## Trigger

The Reader submits an address that does not return a supported feed.

## Outcome

No source is added and the submitted address remains available to correct.
