---
kind: edge
routes:
  web: Web
steps:
  - text: The Owner accepts a pending filing suggestion
    kind: actor
    actor: owner
    entities:
      - { entity: filing-suggestion, effect: reads, facts: [Collection, Tags to add, Reason] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: Every bookmark it covered has been deleted since it was made
    kind: condition
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The Product withdraws the suggestion
    kind: product
    actor: owner
    entities:
      - { entity: filing-suggestion, effect: changes, from: Pending, to: Withdrawn, facts: [] }
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

# Withdraw a suggestion with nothing left to file

## Trigger

The Owner accepts a suggestion whose bookmarks they have since deleted.

## Outcome

No collection is created or changed, and the suggestion is withdrawn.
