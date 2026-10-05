---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner reviews a pending filing suggestion that names a new collection
    kind: actor
    actor: owner
    entities:
      - { entity: filing-suggestion, effect: reads, facts: [Collection, Tags to add, Reason] }
      - { entity: bookmark, effect: reads, facts: [Title, Address] }
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The Owner accepts it
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The Product creates the collection with the suggested name
    kind: product
    actor: owner
    entities:
      - { entity: collection, effect: creates, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The Product files each of the bookmarks into it and adds the suggested tags, creating any tag that is new
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: changes, facts: [Collection, Tags] }
      - { entity: tag, effect: creates, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The Product marks the suggestion accepted
    kind: product
    actor: owner
    entities:
      - { entity: filing-suggestion, effect: changes, from: Pending, to: Accepted, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
---

# File into a new collection

## Trigger

The Owner agrees that a group of bookmarks deserves a collection of its own.

## Outcome

A new collection with the suggested name holds the bookmarks, which carry the
suggested tags, and the suggestion is accepted.

## Edge cases

- A collection with that name was created since the suggestion was made → the bookmarks are filed into it and no second collection is created.
