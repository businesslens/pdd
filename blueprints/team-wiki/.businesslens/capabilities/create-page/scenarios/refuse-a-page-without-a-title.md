---
kind: validation
routes:
  web: Web
steps:
  - text: The Member chooses to add a page and leaves the title empty
    kind: actor
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::space
  - text: The Product explains that a page needs a title
    kind: product
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::space
  - text: No page is added to the space
    kind: condition
    actor: member
    entities:
      - { entity: space, effect: reads, facts: [] }
      - { entity: page, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::space
---

# Refuse a page without a title

## Trigger

An Editor tries to add a page without giving it a title.

## Outcome

No page is created, and the Editor can enter a title and try again.
