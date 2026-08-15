---
kind: primary
actors: [reader, visitor]
result: achieved
steps:
  - text: The Reader publishes the owned collection
    capability: collection-publication
    routes:
      publish-on-web: reader-web::personal-library
  - text: The Product exposes a stable public web address
  - text: The Visitor opens that address without joining the private library
    capability: public-collection-reading
    routes:
      publish-on-web: reader-web::public-reading
  - text: The Product presents the collection's ordered items read-only
---

# Publish and read a collection

## Trigger

The Reader wants to share an owned collection with a Visitor.

## Outcome

The Journey goal is achieved: the Visitor can read the published collection
without receiving editing authority or access to private library state.
