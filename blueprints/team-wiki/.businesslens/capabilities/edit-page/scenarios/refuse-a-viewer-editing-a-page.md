---
kind: permission
routes:
  web: Web
steps:
  - text: The Member, a Viewer in the page's space, tries to edit the page
    kind: actor
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Title] }
      - { entity: space, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::page
  - text: The Product finds that the Member's role in the space is Viewer
    kind: product
    actor: member
    entities:
      - { entity: space-membership, effect: reads, facts: [Role] }
      - { entity: space, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::page
  - text: The Product keeps the page read-only for them
    kind: product
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::page
---

# Refuse a Viewer editing a page

## Trigger

A Viewer tries to edit a page.

## Outcome

The page and its history are unchanged.
