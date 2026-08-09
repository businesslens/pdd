---
kind: edge
journey: share-a-collection
actors: [reader]
result: achieved
flow:
  - capability: collections
    operation: Confirm ownership of the published collection
    availability:
      - interface: reader-web
        experiences: [personal-library]
      - interface: reader-mobile
        experiences: [personal-library]
  - capability: collection-sharing
    operation: Revoke access through the public address
    availability:
      - interface: reader-web
        experiences: [personal-library]
      - interface: reader-mobile
        experiences: [personal-library]
---

# Unlist a published collection

## Trigger

The Reader revokes public access to an owned published collection.

## Steps

1. The Product confirms ownership
2. The Product explains that the public link will stop working
3. The Reader confirms unlisting

## Outcome

The Journey goal is achieved: the collection is private and its public link serves no contents.
