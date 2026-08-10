---
kind: primary
journey: publish-and-share-a-collection
actors: [reader, visitor]
result: achieved
flow:
  - capability: collection-publication
    operation: Publish the owned collection to a stable web address
    availability:
      - interface: reader-web
        experiences: [personal-library]
      - interface: reader-mobile
        experiences: [personal-library]
  - capability: public-collection-reading
    operation: Open and read the published collection
    availability:
      - interface: reader-web
        experiences: [public-reading]
---

# Publish and read a collection

## Trigger

The Reader wants to share an owned collection with a Visitor.

## Steps

1. The Reader publishes the owned collection
2. The Product exposes a stable public web address
3. The Visitor opens that address without joining the private library
4. The Product presents the collection's ordered items read-only

## Outcome

The Journey goal is achieved: the Visitor can read the published collection
without receiving editing authority or access to private library state.
