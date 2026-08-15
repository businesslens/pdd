---
kind: edge
actors: [reader, visitor]
result: not-achieved
steps:
  - text: The Reader publishes the owned collection and shares its public address
    capability: collection-publication
    routes:
      unlist-on-web: reader-web::personal-library
  - text: The Reader unlists the collection
    capability: collection-publication
    routes:
      unlist-on-web: reader-web::personal-library
  - text: The Visitor opens the shared address
    capability: public-collection-reading
    routes:
      unlist-on-web: reader-web::public-reading
  - text: The Product withholds the collection contents and shows a neutral unavailable state
---

# Share a collection the owner already unlisted

## Trigger

The Reader shares a public address and then unlists the collection before the
Visitor opens it.

## Outcome

The Journey goal is not achieved: the Visitor cannot consume the collection.
Unlisting stays authoritative over an address the owner already handed out, and
nothing about the owner's private library is disclosed.
