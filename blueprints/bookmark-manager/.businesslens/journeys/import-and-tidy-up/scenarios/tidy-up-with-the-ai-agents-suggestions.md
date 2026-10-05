---
kind: primary
result: achieved
routes:
  web-and-agent: Web and agent
steps:
  - text: The Owner imports the export file their browser made
    kind: actor
    actor: owner
    capability: import-bookmarks
    entities: []
    contexts:
      web-and-agent:
        place: bookmarks-web::import
  - text: The Product adds the bookmarks the library does not already keep, Unsorted
    kind: product
    actor: owner
    capability: import-bookmarks
    entities:
      - { entity: bookmark, as: imported, effect: creates, facts: [Title, Address, Note, Tags, Collection, Saved at, Imported from folder] }
    contexts:
      web-and-agent:
        place: bookmarks-web::import
  - text: The Product takes the Owner to the Library, narrowed to the Unsorted bookmarks it added
    kind: product
    actor: owner
    capability: browse-library
    entities:
      - { entity: bookmark, as: imported, effect: reads, facts: [Title, Address, Imported from folder] }
    contexts:
      web-and-agent:
        place: bookmarks-web::library
  - text: The AI agent asks for the bookmarks the import added
    kind: actor
    actor: ai-agent
    capability: prepare-suggestions
    entities:
      - { entity: bookmark, as: imported, effect: reads, facts: [] }
    contexts:
      web-and-agent:
        place: bookmarks-agent
  - text: The AI agent leaves filing suggestions for the imported bookmarks, each with its reason
    kind: actor
    actor: ai-agent
    capability: prepare-suggestions
    entities:
      - { entity: filing-suggestion, effect: creates, to: Pending, facts: [Collection, Tags to add, Reason] }
      - { entity: bookmark, as: imported, effect: reads, facts: [] }
    contexts:
      web-and-agent:
        place: bookmarks-agent
  - text: The AI agent leaves a duplicate suggestion for imported bookmarks that lead to the same page as one already kept
    kind: actor
    actor: ai-agent
    capability: prepare-suggestions
    entities:
      - { entity: duplicate-suggestion, effect: creates, to: Pending, facts: [Shared page, Kept bookmark, Reason] }
      - { entity: bookmark, as: imported, effect: reads, facts: [] }
    contexts:
      web-and-agent:
        place: bookmarks-agent
  - text: The Owner accepts a filing suggestion
    kind: actor
    actor: owner
    capability: accept-filing-suggestion
    entities:
      - { entity: filing-suggestion, effect: reads, facts: [Collection, Tags to add, Reason] }
    contexts:
      web-and-agent:
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
      web-and-agent:
        place: bookmarks-web::suggestions
  - text: The Owner merges the duplicate suggestion
    kind: actor
    actor: owner
    capability: merge-duplicates
    entities:
      - { entity: duplicate-suggestion, effect: reads, facts: [Shared page, Kept bookmark, Reason] }
    contexts:
      web-and-agent:
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
      web-and-agent:
        place: bookmarks-web::suggestions
---

# Tidy up with the AI agent's suggestions

## Trigger

The Owner moves from their browser's bookmarks to the library and has an AI agent
connected to help file them.

## Outcome

The Journey goal is achieved: the imported bookmarks are filed into collections
with tags, and the page they had kept twice is one bookmark.
