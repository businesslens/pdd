---
kind: edge
actors: [reader, visitor]
result: not-achieved
flow:
  - id: publish-then-unlist
    capability: collection-publication
    operation: Publish the collection and then unlist it again
  - id: attempt-public-read
    capability: public-collection-reading
    operation: Open the public address after access was revoked
routes:
  - id: unlist-on-web
    contexts:
      - stage: publish-then-unlist
        context: reader-web::personal-library
      - stage: attempt-public-read
        context: reader-web::public-reading
  - id: unlist-from-mobile
    contexts:
      - stage: publish-then-unlist
        context: reader-web::personal-library
      - stage: attempt-public-read
        context: reader-web::public-reading
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
