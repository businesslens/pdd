---
kind: permission
routes:
  web: Web
steps:
  - text: The Member, a Viewer in the page's space, opens the address of a suggestion
    kind: actor
    actor: member
    entities:
      - { entity: suggestion, effect: reads, facts: [] }
      - { entity: space, effect: reads, facts: [] }
      - { entity: page, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::suggestion
  - text: The Product finds that the Member's role in the space is Viewer
    kind: product
    actor: member
    entities:
      - { entity: space-membership, effect: reads, facts: [Role] }
      - { entity: space, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::suggestion
  - text: The Product says the suggestion is unavailable to them
    kind: product
    actor: member
    entities:
      - { entity: suggestion, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::suggestion
---

# Withhold a suggestion from a Viewer

## Trigger

A Viewer follows a link to a suggestion for a page in their space.

## Outcome

The Viewer sees nothing of the suggestion, which stays open, and the page is
unchanged.
