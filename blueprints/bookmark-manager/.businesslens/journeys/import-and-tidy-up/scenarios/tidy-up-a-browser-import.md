---
kind: primary
result: achieved
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
  - text: The assistant proposes merging imported bookmarks that lead to the same page
    kind: actor
    actor: assistant
    capability: prepare-suggestions
    entities:
      - { entity: duplicate-suggestion, effect: creates, to: Pending, facts: [Shared page, Kept bookmark, Reason] }
      - { entity: bookmark, as: imported, effect: reads, facts: [] }
  - text: The Owner accepts a filing suggestion
    kind: actor
    actor: owner
    capability: accept-filing-suggestion
    entities:
      - { entity: filing-suggestion, effect: reads, facts: [Collection, Tags to add, Reason] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The Product files its bookmarks into the collection and adds its tags
    kind: product
    actor: owner
    capability: accept-filing-suggestion
    entities:
      - { entity: bookmark, as: imported, effect: changes, facts: [Collection, Tags] }
      - { entity: filing-suggestion, effect: changes, from: Pending, to: Accepted, facts: [] }
      - { entity: collection, effect: reads, facts: [] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The Owner merges a duplicate suggestion
    kind: actor
    actor: owner
    capability: merge-duplicates
    entities:
      - { entity: duplicate-suggestion, effect: reads, facts: [Shared page, Kept bookmark, Reason] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The Product keeps one bookmark with every tag and note and deletes the others
    kind: product
    actor: owner
    capability: merge-duplicates
    entities:
      - { entity: bookmark, as: kept, effect: changes, facts: [Note, Tags] }
      - { entity: bookmark, as: duplicate, effect: removes }
      - { entity: duplicate-suggestion, effect: changes, from: Pending, to: Merged, facts: [] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
---

# Tidy up a browser import

## Trigger

The Owner wants to move from their browser's bookmarks to the library.

## Outcome

The Journey goal is achieved: the imported bookmarks are filed into collections
with tags, and the page they had kept twice is one bookmark.
