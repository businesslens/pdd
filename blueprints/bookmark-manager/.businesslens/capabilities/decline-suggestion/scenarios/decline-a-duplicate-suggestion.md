---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner reviews a pending duplicate suggestion with its bookmarks and reason
    kind: actor
    actor: owner
    entities:
      - { entity: duplicate-suggestion, effect: reads, facts: [Shared page, Kept bookmark, Reason] }
      - { entity: bookmark, effect: reads, facts: [Title, Address, Saved at] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The Owner declines it
    kind: actor
    actor: owner
    entities:
      - { entity: duplicate-suggestion, effect: changes, from: Pending, to: Declined, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: Every bookmark in it stays in the library, unchanged
    kind: condition
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
---

# Decline a duplicate suggestion

## Trigger

The Owner wants to keep bookmarks the AI agent judged to be the same page, such
as two versions of one page they deliberately keep apart.

## Outcome

The suggestion is declined, every bookmark in it stays, and the AI agent cannot
suggest the same set again.
