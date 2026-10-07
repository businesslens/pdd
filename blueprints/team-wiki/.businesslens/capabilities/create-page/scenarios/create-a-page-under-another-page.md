---
kind: primary
routes:
  web: Web
steps:
  - text: The Member chooses to add a page under the page they are reading
    kind: actor
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Title] }
    contexts:
      web:
        place: wiki-web::workspace::page
  - text: The Member enters a title
    kind: actor
    actor: member
    entities: []
    contexts:
      web:
        place: wiki-web::workspace::page
  - text: The Product creates the page under that one and keeps its first revision
    kind: product
    actor: member
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
---

# Create a page under another page

## Trigger

An Editor has something to write down that belongs beneath an existing page.

## Outcome

The new page sits under the page it was added from, with the chosen title and an
empty body, and the Editor is handed on to write it.
