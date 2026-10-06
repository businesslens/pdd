---
kind: primary
routes:
  web: Web
steps:
  - text: The Administrator chooses to rename a space
    kind: actor
    actor: administrator
    entities:
      - { entity: space, effect: reads, facts: [Name] }
    contexts:
      web:
        place: wiki-web::administration::spaces
  - text: The Administrator enters a new name
    kind: actor
    actor: administrator
    entities: []
    contexts:
      web:
        place: wiki-web::administration::spaces
  - text: The Product gives the space the new name
    kind: product
    actor: administrator
    entities:
      - { entity: space, effect: changes, facts: [Name] }
    contexts:
      web:
        place: wiki-web::administration::spaces
  - text: The space is listed under its new name with the description it had
    kind: condition
    actor: administrator
    entities:
      - { entity: space, effect: reads, facts: [Name, Description] }
    contexts:
      web:
        place: wiki-web::administration::spaces
---

# Rename a space

## Trigger

An Administrator finds a space's name no longer fits the team or topic it
serves.

## Outcome

The space has the new name. Its members, their roles, its pages and their
history are unchanged.

## Edge cases

- The Administrator enters the name the space already has → nothing changes.
