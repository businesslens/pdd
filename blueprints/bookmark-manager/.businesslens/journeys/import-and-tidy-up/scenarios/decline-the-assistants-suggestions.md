---
kind: edge
result: not-achieved
routes:
  web: Web
steps:
  - text: The Owner imports the export file their browser made
    kind: actor
    actor: owner
    capability: import-bookmarks
    entities: []
    contexts:
      web:
        place: bookmarks-web::import
  - text: The Product adds the bookmarks the library does not already keep, Unsorted
    kind: product
    actor: owner
    capability: import-bookmarks
    entities:
      - { entity: bookmark, as: imported, effect: creates, facts: [Title, Address, Note, Tags, Collection, Saved at, Imported from folder] }
    contexts:
      web:
        place: bookmarks-web::import
  - text: The Product takes the Owner to Suggestions while the new bookmarks are reviewed
    kind: product
    actor: owner
    capability: import-bookmarks
    entities:
      - { entity: bookmark, as: imported, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The assistant proposes a collection and tags for the imported bookmarks that belong together
    kind: actor
    actor: assistant
    capability: prepare-suggestions
    entities:
      - { entity: filing-suggestion, effect: creates, to: Pending, facts: [Collection, Tags to add, Reason] }
      - { entity: bookmark, as: imported, effect: reads, facts: [] }
      - { entity: collection, effect: reads, facts: [] }
      - { entity: tag, effect: reads, facts: [] }
  - text: The Owner declines the filing suggestion
    kind: actor
    actor: owner
    capability: decline-suggestion
    entities:
      - { entity: filing-suggestion, effect: changes, from: Pending, to: Declined, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The imported bookmarks stay Unsorted
    kind: condition
    entities:
      - { entity: bookmark, as: imported, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
---

# Decline the assistant's suggestions

## Trigger

The Owner imports their browser's bookmarks but disagrees with how the assistant
would file them.

## Outcome

The Journey goal is not achieved: the imported bookmarks are in the library but
stay Unsorted, ready for the Owner to file themselves or to ask for suggestions
again.
