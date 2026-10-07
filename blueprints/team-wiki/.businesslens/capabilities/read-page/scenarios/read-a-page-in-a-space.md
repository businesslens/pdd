---
kind: primary
routes:
  web: Web
steps:
  - text: The Member opens a space they belong to
    kind: actor
    actor: member
    entities:
      - { entity: space, effect: reads, facts: [Name, Description] }
    contexts:
      web:
        place: wiki-web::workspace::home
  - text: The Product presents the tree of pages in the space, each under its parent
    kind: product
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Title, Parent page] }
      - { entity: space, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::space
  - text: The Member opens a page from the tree
    kind: actor
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Title] }
    contexts:
      web:
        place: wiki-web::workspace::space
  - text: The Product presents the page with when and by whom it was last edited
    kind: product
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Title, Content, Last edited at] }
      - { entity: member, effect: reads, facts: [Name] }
    contexts:
      web:
        place: wiki-web::workspace::page
---

# Read a page in a space

## Trigger

A Member wants to read something their team wrote down.

## Outcome

The Member is reading the current page, knowing where it sits in its space and
who last changed it.

## Edge cases

- The space has no pages yet → the Member is told the space is empty; an Editor is offered to add the first page.
