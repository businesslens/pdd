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
  - text: The Owner dismisses it
    kind: actor
    actor: owner
    entities:
      - { entity: filing-suggestion, effect: changes, from: Proposed, to: Dismissed, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: Its bookmarks stay where they were, with the tags they had
    kind: condition
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
---

# Dismiss a filing suggestion

## Trigger

The Owner disagrees with where their AI agent would file some bookmarks.

## Outcome

The suggestion is dismissed and nothing in the library has changed.
