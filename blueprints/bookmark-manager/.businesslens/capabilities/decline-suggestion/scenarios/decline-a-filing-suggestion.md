---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner reviews a pending filing suggestion with its bookmarks and reason
    kind: actor
    actor: owner
    entities:
      - { entity: filing-suggestion, effect: reads, facts: [Collection, Tags to add, Reason] }
      - { entity: bookmark, effect: reads, facts: [Title, Address] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The Owner declines it
    kind: actor
    actor: owner
    entities:
      - { entity: filing-suggestion, effect: changes, from: Pending, to: Declined, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: Its bookmarks stay where they were, with the tags they had
    kind: condition
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
---

# Decline a filing suggestion

## Trigger

The Owner disagrees with where the assistant would file some bookmarks.

## Outcome

The suggestion is declined and nothing in the library has changed.
