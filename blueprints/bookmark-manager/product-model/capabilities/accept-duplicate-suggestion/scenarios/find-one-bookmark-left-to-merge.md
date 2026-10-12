---
kind: edge
routes:
  web: Web
steps:
  - text: The Owner accepts a proposed duplicate suggestion
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
  - text: The Product closes the suggestion as outdated
    kind: product
    actor: owner
    entities:
      - { entity: duplicate-suggestion, effect: changes, from: Proposed, to: Outdated, facts: [] }
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

# Find one bookmark left to merge

## Trigger

The Owner accepts a duplicate suggestion after deleting all but one of its
bookmarks themselves.

## Outcome

The remaining bookmark is untouched, and the suggestion is outdated.
