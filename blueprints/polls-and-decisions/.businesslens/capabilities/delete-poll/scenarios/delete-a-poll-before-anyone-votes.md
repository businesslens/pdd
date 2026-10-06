---
kind: primary
routes:
  web: Web
steps:
  - text: The Member chooses to delete an open poll they own that nobody has voted on
    kind: actor
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Question, Votes cast, Closed at] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product asks the Member to confirm, saying how many comments will be deleted with it
    kind: product
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [Question] }
      - { entity: comment, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Member confirms
    kind: actor
    actor: member
    entities:
      - { entity: poll, effect: removes, from: Open }
      - { entity: comment, effect: removes }
    contexts:
      web:
        place: polls-web::poll
  - text: No Member finds the poll or its comments in the poll list
    kind: condition
    actor: member
    entities:
      - { entity: poll, effect: reads, facts: [] }
      - { entity: comment, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll-list
---

# Delete a poll before anyone votes

## Trigger

The owner of an open poll spots a typo or a wrong option before anyone has
voted.

## Outcome

The poll and its comments are gone for good, and no Member finds it in the poll
list. The owner can open the question again, corrected.

## Edge cases

- The Member declines to confirm → the poll and its comments stay as they were.
