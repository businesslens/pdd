---
kind: edge
routes:
  web: Web
steps:
  - text: The poll is open and allows multiple choice
    kind: condition
    entities:
      - { entity: poll, effect: reads, facts: [Choice mode, Closed at] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Member chooses every option they support and casts their vote
    kind: actor
    actor: member
    entities:
      - { entity: vote, effect: creates, facts: [Chosen options, Cast at] }
    contexts:
      web:
        place: polls-web::poll
  - text: The Product counts the vote once toward each chosen option
    kind: product
    actor: member
    entities:
      - { entity: vote, effect: reads, facts: [Chosen options] }
    contexts:
      web:
        place: polls-web::poll
---

# Choose several options

## Trigger

A Member supports more than one option on a multiple-choice poll.

## Outcome

The Member holds one vote that counts once toward each option they chose.

## Edge cases

- The Member chooses no option → nothing is cast, and the poll asks for at least one.
