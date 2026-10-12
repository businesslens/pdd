---
kind: primary
routes:
  web: Web
steps:
  - text: The Administrator picks a person from the workspace who does not belong to the space
    kind: actor
    actor: administrator
    entities:
      - { entity: member, effect: reads, facts: [Name] }
      - { entity: space, effect: reads, facts: [Name] }
    contexts:
      web:
        place: wiki-web::administration::space-members
  - text: The Administrator chooses Viewer or Editor for them
    kind: actor
    actor: administrator
    entities: []
    contexts:
      web:
        place: wiki-web::administration::space-members
  - text: The Product adds them to the space with that role
    kind: product
    actor: administrator
    entities:
      - { entity: space-membership, effect: creates, facts: [Role] }
      - { entity: space, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::administration::space-members
  - text: The person is listed among the space members with their role
    kind: condition
    actor: administrator
    entities:
      - { entity: space-membership, effect: reads, facts: [Role] }
      - { entity: member, effect: reads, facts: [Name] }
      - { entity: space, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::administration::space-members
---

# Add a member to a space

## Trigger

An Administrator wants a person to read, or to write, in a space.

## Outcome

The person belongs to the space with the chosen role and finds it on their home
the next time they look.

## Edge cases

- The person already belongs to the space → they are not offered again; their role stays as it is.
