---
kind: primary
result: achieved
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
    entities:
      - { entity: space, effect: reads, facts: [Name] }
      - { entity: member, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::administration::space-members
  - text: The Administrator adds the team's people, each as a Viewer or an Editor
    kind: actor
    actor: administrator
    capability: add-space-member
    entities:
      - { entity: space-membership, effect: creates, facts: [Role] }
      - { entity: member, effect: reads, facts: [Name] }
    contexts:
      web:
        place: wiki-web::administration::space-members
---

# Open a new space to its team

## Trigger

A team needs a place of its own in the wiki.

## Outcome

The Journey goal is achieved: the team's people find the new space on their home
and can read, or write, in it.
