---
kind: primary
routes:
  web: Web
steps:
  - text: The Administrator chooses Editor for a person who is a Viewer in the space
    kind: actor
    actor: administrator
    entities:
      - { entity: member, effect: reads, facts: [Name] }
      - { entity: space-membership, effect: changes, facts: [Role] }
      - { entity: space, effect: reads, facts: [Name] }
    contexts:
      web:
        place: wiki-web::administration::space-members
  - text: The person is listed among the space members as an Editor
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

# Make a Viewer an Editor

## Trigger

An Administrator wants someone who reads a space to write in it too.

## Outcome

The person is an Editor in the space: they can add, edit, move, delete and
restore its pages, and its proposed suggestions appear in their suggestions.
