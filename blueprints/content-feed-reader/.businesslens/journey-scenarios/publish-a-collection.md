---
kind: primary
journey: share-a-collection
actors: [reader]
result: achieved
flow:
  - capability: collections
    operation: Confirm ownership of the collection
    availability:
      - interface: reader-web
        experiences: [personal-library]
      - interface: reader-mobile
        experiences: [personal-library]
  - capability: collection-sharing
    operation: Publish the collection to a stable web address
    availability:
      - interface: reader-web
        experiences: [personal-library]
      - interface: reader-mobile
        experiences: [personal-library]
---

# Publish a collection

## Trigger

The Reader chooses to publish a private owned collection.

## Steps

1. The Product confirms ownership
2. The Product explains that the collection will become readable by link
3. The Reader confirms publication
4. A stable public web address is created

## Outcome

The Journey goal is achieved: the owned collection is publicly readable by link.
