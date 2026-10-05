---
kind: edge
result: achieved
routes:
  web: Web
steps:
  - text: The Member adds a page with a title under the page they are reading
    kind: actor
    actor: member
    capability: create-page
    entities:
      - { entity: page, effect: creates, facts: [Title, Content, Parent page, Last edited at] }
      - { entity: revision, effect: creates, facts: [Title, Content, Saved at, Origin] }
    contexts:
      web:
        place: wiki-web::workspace::page
  - text: The Product opens the new page to be written
    kind: product
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Title, Parent page] }
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

# Write a new page under another page

## Trigger

An Editor has something new to write down that belongs beneath an existing page.

## Outcome

The Journey goal is achieved: the new page sits under the page it was added from
and holds the Editor's content.
