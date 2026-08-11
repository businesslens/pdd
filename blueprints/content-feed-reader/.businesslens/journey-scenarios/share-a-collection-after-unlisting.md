---
kind: edge
journey: publish-and-share-a-collection
actors: [reader, visitor]
result: not-achieved
flow:
  - capability: collection-publication
    operation: Publish the collection and then unlist it again
    availability:
      - interface: reader-web
        experiences: [personal-library]
      - interface: reader-mobile
        experiences: [personal-library]
  - capability: public-collection-reading
    operation: Open the public address after access was revoked
    availability:
      - interface: reader-web
        experiences: [public-reading]
---

# Share a collection the owner already unlisted

## Trigger

The Reader shares a public address and then unlists the collection before the
Visitor opens it.

## Steps

1. The Reader publishes the owned collection and shares its public address
2. The Reader unlists the collection
3. The Visitor opens the shared address
4. The Product withholds the collection contents and shows a neutral unavailable state

## Outcome

The Journey goal is not achieved: the Visitor cannot consume the collection.
Unlisting stays authoritative over an address the owner already handed out, and
nothing about the owner's private library is disclosed.
