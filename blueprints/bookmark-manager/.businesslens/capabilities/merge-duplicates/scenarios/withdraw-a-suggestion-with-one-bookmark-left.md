---
kind: edge
routes:
  web: Web
steps:
  - text: The Owner merges a pending duplicate suggestion
    kind: actor
    actor: owner
    entities:
      - { entity: duplicate-suggestion, effect: reads, facts: [Shared page, Kept bookmark, Reason] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: All but one of its bookmarks have been deleted since it was made
    kind: condition
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The Product withdraws the suggestion
    kind: product
    actor: owner
    entities:
      - { entity: duplicate-suggestion, effect: changes, from: Pending, to: Withdrawn, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The Product explains that nothing was left to merge
    kind: product
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::suggestions
---

# Withdraw a suggestion with one bookmark left

## Trigger

The Owner merges a suggestion after deleting all but one of its bookmarks
themselves.

## Outcome

The remaining bookmark is untouched, and the suggestion is withdrawn.
