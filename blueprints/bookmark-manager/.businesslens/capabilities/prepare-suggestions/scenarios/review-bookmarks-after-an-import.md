---
kind: primary
routes:
  web: Web
steps:
  - text: An import has just added bookmarks to Unsorted
    kind: condition
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::import
  - text: The assistant reads the added bookmarks, the browser folders they came from, and the collections and tags already kept
    kind: actor
    actor: assistant
    entities:
      - { entity: bookmark, effect: reads, facts: [Title, Address, Imported from folder] }
      - { entity: collection, effect: reads, facts: [Name] }
      - { entity: tag, effect: reads, facts: [Name] }
  - text: The assistant proposes a collection and tags for each group of added bookmarks
    kind: actor
    actor: assistant
    entities:
      - { entity: filing-suggestion, effect: creates, to: Pending, facts: [Collection, Tags to add, Reason] }
      - { entity: bookmark, effect: reads, facts: [] }
      - { entity: collection, effect: reads, facts: [] }
      - { entity: tag, effect: reads, facts: [] }
  - text: The assistant proposes merging added bookmarks that lead to the same page as each other or as one already kept
    kind: actor
    actor: assistant
    entities:
      - { entity: duplicate-suggestion, effect: creates, to: Pending, facts: [Shared page, Kept bookmark, Reason] }
      - { entity: bookmark, effect: reads, facts: [] }
  - text: The Product presents the new suggestions to the Owner as they arrive
    kind: product
    actor: owner
    entities:
      - { entity: filing-suggestion, effect: reads, facts: [Collection, Tags to add, Reason] }
      - { entity: duplicate-suggestion, effect: reads, facts: [Shared page, Kept bookmark, Reason] }
      - { entity: bookmark, effect: reads, facts: [Title, Address] }
    contexts:
      web:
        place: bookmarks-web::suggestions
---

# Review bookmarks after an import

## Trigger

An import has added bookmarks to the library and handed them to the assistant.

## Outcome

Pending suggestions for the imported bookmarks wait for the Owner's decision,
and the imported bookmarks are still Unsorted.
