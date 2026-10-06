---
kind: validation
routes:
  web: Web
steps:
  - text: The Administrator enters, as a space's new name, a name another space already has
    kind: actor
    actor: administrator
    entities:
      - { entity: space, effect: reads, facts: [Name] }
    contexts:
      web:
        place: wiki-web::administration::spaces
  - text: The Product finds another space with that name
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

# Refuse a name another space has

## Trigger

An Administrator renames a space to a name already used in the workspace.

## Outcome

The space keeps its name, and the entered name stays available to change.
