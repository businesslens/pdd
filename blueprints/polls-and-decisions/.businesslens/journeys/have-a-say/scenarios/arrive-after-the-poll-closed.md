---
kind: edge
result: not-achieved
routes:
  web: Web
steps:
  - text: The Member opens a poll from the poll list
    kind: actor
    actor: member
    capability: browse-polls
    entities:
      - { entity: poll, effect: reads, facts: [Question, Closed at] }
    contexts:
      web:
        place: polls-web::poll
  - text: The poll closed before the Member voted
    kind: condition
    actor: member
    capability: vote-on-poll
    entities:
      - { entity: poll, effect: reads, facts: [Closed at] }
      - { entity: vote, effect: reads, facts: [] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product shows the final results, with nothing left to choose
    kind: product
    actor: member
    capability: view-results
    entities:
      - { entity: poll, effect: reads, facts: [Tally, Closed at] }
    contexts:
      web:
        place: polls-web::poll
---

# Arrive after the poll closed

## Trigger

A Member opens a poll to vote on it after it has already closed.

## Outcome

The Journey goal is not achieved: the Member casts no vote. They see the final
results and when voting ended.
