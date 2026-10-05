---
kind: edge
result: not-achieved
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
  - text: The Owner declines the filing suggestions
    kind: actor
    actor: owner
    capability: decline-suggestion
    entities:
      - { entity: filing-suggestion, effect: changes, from: Pending, to: Declined, facts: [] }
    contexts:
      web-and-agent:
        place: bookmarks-web::suggestions
  - text: The imported bookmarks stay Unsorted
    kind: condition
    actor: owner
    entities:
      - { entity: bookmark, as: imported, effect: reads, facts: [] }
    contexts:
      web-and-agent:
        place: bookmarks-web::suggestions
---

# Decline the AI agent's suggestions

## Trigger

The Owner imports their browser's bookmarks but disagrees with how their AI
agent would file them.

## Outcome

The Journey goal is not achieved: the imported bookmarks are in the library but
stay Unsorted, ready for the Owner to file themselves.
