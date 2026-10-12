---
kind: primary
routes:
  web: Web
steps:
  - text: The Administrator chooses to create a space
    kind: actor
    actor: administrator
    entities:
      - { entity: space, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::administration::spaces
  - text: The Administrator enters a name and a description
    kind: actor
    actor: administrator
    entities: []
    contexts:
      web:
        place: wiki-web::administration::spaces
  - text: The Product creates the space
    kind: product
    actor: administrator
    entities:
      - { entity: space, effect: creates, facts: [Name, Description] }
    contexts:
      web:
        place: wiki-web::administration::spaces
  - text: The Product opens the members of the new space so its first members can be added
    kind: product
    actor: administrator
    entities:
      - { entity: space, effect: reads, facts: [Name] }
      - { entity: member, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::administration::space-members
---

# Create a space

## Trigger

An Administrator wants a new area of the wiki for a team or topic.

## Outcome

The space exists with its name and description, has no members or pages yet, and
its members are open to be added.
