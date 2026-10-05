---
kind: validation
routes:
  web: Web
steps:
  - text: The Member, a Viewer in the space, tries to add a page to it
    kind: actor
    actor: member
    entities:
      - { entity: space, effect: reads, facts: [Name] }
      - { entity: page, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::space
  - text: The Product finds that the Member's role in the space is Viewer
    kind: product
    actor: member
    entities:
      - { entity: space-membership, effect: reads, facts: [Role] }
      - { entity: space, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::space
  - text: The Product explains that only the space's Editors add pages
    kind: product
    actor: member
    entities:
      - { entity: space, effect: reads, facts: [] }
      - { entity: page, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::space
---

# Refuse a Viewer adding a page

## Trigger

A Viewer tries to add a page to a space.

## Outcome

No page is created and the space is unchanged.
