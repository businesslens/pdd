---
kind: primary
routes:
  web: Web
steps:
  - text: The Administrator chooses to remove a person from the space
    kind: actor
    actor: administrator
    entities:
      - { entity: member, effect: reads, facts: [Name] }
      - { entity: space-membership, effect: reads, facts: [Role] }
      - { entity: space, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::administration::space-members
  - text: The Product explains that they will no longer see the space or anything in it
    kind: product
    actor: administrator
    entities:
      - { entity: space, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::administration::space-members
  - text: The Administrator confirms
    kind: actor
    actor: administrator
    entities:
      - { entity: space-membership, effect: removes }
    contexts:
      web:
        place: wiki-web::administration::space-members
  - text: The person is no longer listed among the space members
    kind: condition
    actor: administrator
    entities:
      - { entity: member, effect: reads, facts: [] }
      - { entity: space, effect: reads, facts: [] }
    contexts:
      web:
        place: wiki-web::administration::space-members
---

# Remove a member from a space

## Trigger

An Administrator wants a person to lose access to a space.

## Outcome

The person no longer belongs to the space. Its pages, history and suggestions
are withheld from them from their next request on, and the revisions they saved
still name them.

## Edge cases

- The person is the space's last Editor → they are removed all the same; the space keeps its pages and can be edited again once an Editor is added.
- The Administrator declines to confirm → the person keeps their role.
