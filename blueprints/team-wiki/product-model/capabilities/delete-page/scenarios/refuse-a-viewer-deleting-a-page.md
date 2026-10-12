---
kind: validation
routes:
  web: Web
steps:
  - text: The Member, a Viewer in the space, tries to delete a page in it
    kind: actor
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Title] }
      - { entity: space, effect: reads, facts: [] }
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
  - text: The Product explains that only the space's Editors delete pages
    kind: product
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [] }
      - { entity: space, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::space
---

# Refuse a Viewer deleting a page

## Trigger

A Viewer tries to delete a page in a space.

## Outcome

The page, its history and the space's tree are unchanged.
