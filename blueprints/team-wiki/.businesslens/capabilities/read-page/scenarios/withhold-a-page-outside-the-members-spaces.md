---
kind: permission
routes:
  web: Web
steps:
  - text: The Member opens the address of a page in a space they do not belong to
    kind: actor
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [] }
      - { entity: space, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::page
  - text: The Product finds that the Member does not belong to the page's space
    kind: product
    actor: member
    entities:
      - { entity: space-membership, effect: reads, facts: [] }
      - { entity: space, effect: reads, facts: [] }
      - { entity: page, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::page
  - text: The Product says the page is unavailable, without revealing its title or its space
    kind: product
    actor: member
    entities:
      - { entity: space, effect: reads, facts: [] }
      - { entity: page, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::page
---

# Withhold a page outside the Member's spaces

## Trigger

A Member follows a link to a page in a space they do not belong to.

## Outcome

The Member learns nothing about the page or its space, and nothing changed.
