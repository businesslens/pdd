---
kind: validation
routes:
  web: Web
steps:
  - text: The Administrator enters a name another space already has
    kind: actor
    actor: administrator
    entities:
      - { entity: space, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::administration::spaces
  - text: The Product finds a space with that name
    kind: product
    actor: administrator
    entities:
      - { entity: space, effect: reads, facts: [Name] }
    contexts:
      web:
        place: wiki-web::administration::spaces
  - text: The Product explains that the name is taken and keeps what was entered
    kind: product
    actor: administrator
    entities: []
    contexts:
      web:
        place: wiki-web::administration::spaces
---

# Refuse a space name already in use

## Trigger

An Administrator creates a space with a name already used in the workspace.

## Outcome

No space is created, and the entered name and description stay available to
change.
