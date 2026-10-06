---
kind: edge
result: not-achieved
routes:
  web: Web
steps:
  - text: The Administrator creates a space with a name and a description
    kind: actor
    actor: administrator
    capability: create-space
    entities:
      - { entity: space, effect: creates, facts: [Name, Description] }
    contexts:
      web:
        place: wiki-web::administration::spaces
  - text: The Product opens the members of the new space
    kind: product
    actor: administrator
    capability: create-space
    entities:
      - { entity: space, effect: reads, facts: [Name] }
      - { entity: member, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::administration::space-members
  - text: The Administrator leaves without adding anyone
    kind: actor
    actor: administrator
    entities: []
    contexts:
      web:
        place: wiki-web::administration::space-members
---

# Leave a new space without members

## Trigger

An Administrator creates a space and leaves before adding its members.

## Outcome

The Journey goal is not achieved: the space exists but nobody can see it until
an Administrator adds members.
