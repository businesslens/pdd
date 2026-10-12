---
kind: edge
routes:
  web: Web
steps:
  - text: The Administrator chooses Viewer for a person who is an Editor in the space
    kind: actor
    actor: administrator
    entities:
      - { entity: member, effect: reads, facts: [Name] }
      - { entity: space-membership, effect: changes, facts: [Role] }
      - { entity: space, effect: reads, facts: [Name] }
    contexts:
      web:
        place: wiki-web::administration::space-members
  - text: The person is listed among the space members as a Viewer
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

# Make an Editor a Viewer

## Trigger

An Administrator wants someone who writes in a space only to read it.

## Outcome

The person still reads the space and its history, but can no longer change its
pages or decide on its suggestions, and the revisions they saved still name
them.

## Edge cases

- The person is the space's last Editor → the change is made all the same; the space can be edited again once another Editor is added.
