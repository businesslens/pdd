---
kind: primary
routes:
  web: Web
steps:
  - text: The Member opens the page to edit it
    kind: actor
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Title, Content] }
    contexts:
      web:
        place: wiki-web::workspace::page
  - text: The Member changes the title or content and saves
    kind: actor
    actor: member
    entities: []
    contexts:
      web:
        place: wiki-web::workspace::page
  - text: The Product makes the saved title and content the page's current revision
    kind: product
    actor: member
    entities:
      - { entity: page, effect: changes, facts: [Title, Content, Last edited at] }
      - { entity: revision, effect: creates, facts: [Title, Content, Saved at, Origin] }
    contexts:
      web:
        place: wiki-web::workspace::page
  - text: Everyone in the space now reads the saved page, with the Member named as its last editor
    kind: condition
    actor: member
    entities:
      - { entity: page, effect: reads, facts: [Title, Content, Last edited at] }
      - { entity: member, effect: reads, facts: [Name] }
      - { entity: space, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::workspace::page
---

# Edit and save a page

## Trigger

An Editor sees something on a page that should change.

## Outcome

The page says what the Editor saved, and the revision before it is kept in the
history.

## Edge cases

- The Editor saves without changing anything → no revision is added.
- The Editor leaves without saving → the page and its history are unchanged.
