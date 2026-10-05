---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner chooses to delete the open collection
    kind: actor
    actor: owner
    entities:
      - { entity: collection, effect: reads, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::collection
  - text: The Product asks the Owner to confirm, and says that its bookmarks will become Unsorted
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::collection
  - text: The Owner confirms
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::collection
  - text: The Product deletes the collection and leaves each of its bookmarks Unsorted
    kind: product
    actor: owner
    entities:
      - { entity: collection, effect: removes }
      - { entity: bookmark, effect: changes, facts: [Collection] }
    contexts:
      web:
        place: bookmarks-web::collection
  - text: The Owner is back in the library, where those bookmarks are Unsorted
    kind: condition
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::library
---

# Delete a collection and keep its bookmarks

## Trigger

The Owner no longer wants a collection.

## Outcome

The collection is gone, and every bookmark it held is still in the library,
Unsorted, with its title, note and tags.

## Edge cases

- The Owner declines to confirm → the collection and its bookmarks stay as they were.
- A pending filing suggestion names the deleted collection → accepting it creates a collection of that name again.
