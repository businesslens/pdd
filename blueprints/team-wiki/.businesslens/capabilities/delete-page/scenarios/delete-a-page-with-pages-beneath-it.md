---
kind: edge
routes:
  web: Web
steps:
  - text: The Member chooses to delete a page that has pages beneath it
    kind: actor
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Title, Parent page] }
    contexts:
      web:
        place: wiki-web::workspace::space
  - text: The Product asks the Member to confirm, saying the page and its history will be deleted for good and the pages beneath it will move up to its parent
    kind: product
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Title, Parent page] }
    contexts:
      web:
        place: wiki-web::workspace::space
  - text: The Member confirms
    kind: actor
    actor: member
    entities:
      - { entity: page, effect: removes }
    contexts:
      web:
        place: wiki-web::workspace::space
  - text: The Product deletes its revisions and any suggestion still proposed for it, and places each page that sat directly beneath it under its parent, or at the top of the space when it had none
    kind: product
    actor: member
    entities:
      - { entity: page, effect: changes, facts: [Parent page] }
      - { entity: space, effect: reads, facts: [] }
      - { entity: revision, effect: removes }
      - { entity: suggestion, effect: removes, from: Proposed }
    contexts:
      web:
        place: wiki-web::workspace::space
---

# Delete a page with pages beneath it

## Trigger

An Editor deletes a page that other pages sit under.

## Outcome

The page and its history are gone for good. The pages that sat directly beneath
it now sit under its parent, keeping their own pages, content and revisions.
