---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner reviews a proposed filing suggestion with its bookmarks and reason
    kind: actor
    actor: owner
    entities:
      - { entity: filing-suggestion, effect: reads, facts: [Collection, Tags to add, Reason] }
      - { entity: bookmark, effect: reads, facts: [Title, Address] }
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
  - text: The Product files each of its bookmarks into the collection and adds its tags, creating any tag that is new
    kind: product
    actor: owner
    entities:
      - { entity: collection, effect: reads, facts: [Name] }
      - { entity: bookmark, effect: changes, facts: [Collection, Tags] }
      - { entity: tag, effect: creates, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The Product marks the suggestion accepted
    kind: product
    actor: owner
    entities:
      - { entity: filing-suggestion, effect: changes, from: Proposed, to: Accepted, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: Nothing the suggestion did not name has changed
    kind: condition
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
---

# File into an existing collection

## Trigger

The Owner agrees that a group of bookmarks belongs in a collection they already
have.

## Outcome

The bookmarks are filed in that collection and carry the suggested tags, and the
suggestion is accepted.

## Edge cases

- One of its bookmarks was deleted since → the rest are filed and the deleted one is skipped.
