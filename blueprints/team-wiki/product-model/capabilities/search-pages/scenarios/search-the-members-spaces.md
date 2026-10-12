---
kind: primary
routes:
  web: Web
steps:
  - text: The Member enters a term
    kind: actor
    actor: member
    entities: []
    contexts:
      web:
        place: wiki-web::workspace::search
  - text: The Product finds the pages whose title or content match, in the spaces the Member belongs to
    kind: product
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Title, Content] }
      - { entity: space, effect: reads, facts: [Name] }
    contexts:
      web:
        place: wiki-web::workspace::search
  - text: The Member opens a page from what was found
    kind: actor
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Title] }
    contexts:
      web:
        place: wiki-web::workspace::search
---

# Search the Member's spaces

## Trigger

A Member remembers something about a page but not where it is.

## Outcome

The Member has the page they were looking for, found from one term, with nothing
in the wiki changed.

## Edge cases

- Nothing matches → the Member is told so, and the term stays available to change.
- A page in a space the Member does not belong to matches → it is neither shown nor counted.
