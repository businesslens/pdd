---
kind: edge
result: not-achieved
steps:
  - text: The Reader publishes the owned collection and shares its public address
    kind: actor
    actor: reader
    capability: collection-publication
    contexts:
      unlist-on-web:
        place: reader-web::personal-library::collection-workspace
  - text: The Reader unlists the collection
    kind: actor
    actor: reader
    capability: collection-publication
    contexts:
      unlist-on-web:
        place: reader-web::personal-library::collection-workspace
  - text: The Visitor opens the shared address
    kind: actor
    actor: visitor
    capability: public-collection-reading
    contexts:
      unlist-on-web:
        place: reader-web::public-reading::public-collection
  - text: The Product withholds the collection contents and shows a neutral unavailable state
    kind: product
routes:
  unlist-on-web: Unlist On Web
---

# Share a collection the owner already unlisted

## Trigger

The Reader shares a public address and then unlists the collection before the
Visitor opens it.

## Outcome

The Journey goal is not achieved: the Visitor cannot consume the collection.
Unlisting stays authoritative over an address the owner already handed out, and
nothing about the owner's private library is disclosed.
