---
kind: primary
routes:
  web: Web
steps:
  - text: The Member chooses to add a page at the top of the space
    kind: actor
    actor: member
    entities:
      - { entity: space, effect: reads, facts: [Name] }
      - { entity: page, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::space
  - text: The Member enters a title
    kind: actor
    actor: member
    entities: []
    contexts:
      web:
        place: wiki-web::workspace::space
  - text: The Product creates the page with no parent page and keeps its first revision
    kind: product
    actor: member
    entities:
      - { entity: page, effect: creates, facts: [Title, Content, Parent page, Last edited at] }
      - { entity: revision, effect: creates, facts: [Title, Content, Saved at, Origin] }
    contexts:
      web:
        place: wiki-web::workspace::space
  - text: The Product opens the new page to be written
    kind: product
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Title] }
    contexts:
      web:
        place: wiki-web::workspace::page
---

# Create a page at the top of a space

## Trigger

An Editor has something to write down that belongs at the top of a space.

## Outcome

The space has a new top-level page with the chosen title and an empty body, and
the Editor is handed on to write it.
