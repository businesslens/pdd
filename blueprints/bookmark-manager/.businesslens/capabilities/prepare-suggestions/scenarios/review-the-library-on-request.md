---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner asks for suggestions
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The assistant reads the Unsorted bookmarks with the collections and tags the library already has
    kind: actor
    actor: assistant
    entities:
      - { entity: bookmark, effect: reads, facts: [Title, Address, Note, Tags, Imported from folder] }
      - { entity: collection, effect: reads, facts: [Name] }
      - { entity: tag, effect: reads, facts: [Name] }
  - text: The assistant proposes a collection and tags for each group of bookmarks that belong together
    kind: actor
    actor: assistant
    entities:
      - { entity: filing-suggestion, effect: creates, to: Pending, facts: [Collection, Tags to add, Reason] }
      - { entity: bookmark, effect: reads, facts: [] }
      - { entity: collection, effect: reads, facts: [] }
      - { entity: tag, effect: reads, facts: [] }
  - text: The assistant proposes merging bookmarks anywhere in the library that lead to the same page
    kind: actor
    actor: assistant
    entities:
      - { entity: duplicate-suggestion, effect: creates, to: Pending, facts: [Shared page, Kept bookmark, Reason] }
      - { entity: bookmark, effect: reads, facts: [] }
  - text: The Product presents the new suggestions, each with its bookmarks and reason
    kind: product
    actor: owner
    entities:
      - { entity: filing-suggestion, effect: reads, facts: [Collection, Tags to add, Reason] }
      - { entity: duplicate-suggestion, effect: reads, facts: [Shared page, Kept bookmark, Reason] }
      - { entity: bookmark, effect: reads, facts: [Title, Address] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: No bookmark, collection or tag has changed
    kind: condition
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
      - { entity: collection, effect: reads, facts: [] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
---

# Review the library on request

## Trigger

The Owner wants help tidying their Unsorted bookmarks.

## Outcome

Pending suggestions wait for the Owner's decision, each saying why, and the
library is exactly as it was.

## Edge cases

- The assistant would repeat a suggestion the Owner declined or one still pending → it does not suggest it again.
