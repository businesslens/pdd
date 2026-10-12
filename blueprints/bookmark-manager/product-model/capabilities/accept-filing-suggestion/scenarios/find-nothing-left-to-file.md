---
kind: edge
routes:
  web: Web
steps:
  - text: The Owner accepts a proposed filing suggestion
    kind: actor
    actor: owner
    entities:
      - { entity: filing-suggestion, effect: reads, facts: [Collection, Tags to add, Reason] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: Every bookmark it covered has been deleted since it was made
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
      - { entity: filing-suggestion, effect: changes, from: Proposed, to: Outdated, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The Product explains that nothing was left to file
    kind: product
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::suggestions
---

# Find nothing left to file

## Trigger

The Owner accepts a suggestion whose bookmarks they have since deleted.

## Outcome

No collection is created or changed, and the suggestion is outdated.
