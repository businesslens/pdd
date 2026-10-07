---
kind: primary
routes:
  web: Web
steps:
  - text: The Member chooses to move the page they are reading
    kind: actor
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Title, Parent page] }
    contexts:
      web:
        place: wiki-web::workspace::page
  - text: The Member picks a new parent page in the same space
    kind: actor
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Title] }
      - { entity: space, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::page
  - text: The Product places the page, and the pages beneath it, under the new parent
    kind: product
    actor: member
    entities:
      - { entity: page, effect: changes, facts: [Parent page] }
    contexts:
      web:
        place: wiki-web::workspace::page
---

# Move a page under another page

## Trigger

An Editor finds a page in the wrong place in its space's tree.

## Outcome

The page and everything beneath it sit under the new parent, their content and
history unchanged.

## Edge cases

- The Editor picks the top of the space → the page becomes a top-level page.
- A page in another space is never offered as the new parent.
