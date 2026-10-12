---
kind: validation
routes:
  web: Web
steps:
  - text: The Member picks one of the pages beneath the page as its new parent
    kind: actor
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Title, Parent page] }
    contexts:
      web:
        place: wiki-web::workspace::page
  - text: The Product explains that a page cannot sit beneath one of its own pages
    kind: product
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::page
  - text: The page stays where it was
    kind: condition
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Parent page] }
    contexts:
      web:
        place: wiki-web::workspace::page
---

# Refuse moving a page beneath itself

## Trigger

An Editor tries to move a page under a page that sits beneath it.

## Outcome

The tree is unchanged and the Editor can pick another parent.
