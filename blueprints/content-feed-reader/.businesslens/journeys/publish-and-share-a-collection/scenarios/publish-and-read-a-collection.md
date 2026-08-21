---
kind: primary
result: achieved
steps:
  - text: The Reader publishes the owned collection
    kind: actor
    actor: reader
    capability: collection-publication
    places:
      publish-on-web: reader-web::personal-library::collection-workspace
  - text: The Product exposes a stable public web address
    kind: product
  - text: The Visitor opens that address without joining the private library
    kind: actor
    actor: visitor
    capability: public-collection-reading
    places:
      publish-on-web: reader-web::public-reading::public-collection
  - text: The Product presents the collection's ordered items read-only
    kind: product
routes:
  publish-on-web: Publish On Web
---

# Publish and read a collection

## Trigger

The Reader wants to share an owned collection with a Visitor.

## Outcome

The Journey goal is achieved: the Visitor can read the published collection
without receiving editing authority or access to private library state.
