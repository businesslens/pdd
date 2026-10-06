---
kind: primary
result: achieved
routes:
  web: Web
steps:
  - text: The Member adds a page at the top of the space with a title
    kind: actor
    actor: member
    capability: create-page
    entities:
      - { entity: page, effect: creates, facts: [Title, Content, Parent page, Last edited at] }
      - { entity: revision, effect: creates, facts: [Title, Content, Saved at, Origin] }
      - { entity: space, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::space
  - text: The Product opens the new page to be written
    kind: product
    actor: member
    capability: create-page
    entities:
      - { entity: page, effect: reads, facts: [Title] }
    contexts:
      web:
        place: wiki-web::workspace::page
  - text: The Member writes the content and saves
    kind: actor
    actor: member
    capability: edit-page
    entities:
      - { entity: page, effect: changes, facts: [Content, Last edited at] }
      - { entity: revision, effect: creates, facts: [Title, Content, Saved at, Origin] }
    contexts:
      web:
        place: wiki-web::workspace::page
---

# Write a new top-level page

## Trigger

An Editor has something new to write down that belongs at the top of a space.

## Outcome

The Journey goal is achieved: the space has a new top-level page with the
Editor's content.
