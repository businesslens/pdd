---
kind: validation
routes:
  agent: Agent
steps:
  - text: The AI agent tries to move a card to another column itself
    kind: actor
    actor: ai-agent
    entities:
      - { entity: card, effect: reads, facts: [Title, Column] }
      - { entity: column, effect: reads, facts: [Name] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      agent:
        place: board-agent
  - text: The Product refuses, because the agent connection offers no way to change a card
    kind: product
    actor: ai-agent
    entities:
      - { entity: card, effect: reads, facts: [] }
    contexts:
      agent:
        place: board-agent
  - text: The card stays where it was
    kind: condition
    actor: ai-agent
    entities:
      - { entity: card, effect: reads, facts: [Column, Position] }
    contexts:
      agent:
        place: board-agent
---

# Refuse a direct change from the AI agent

## Trigger

The AI agent tries to change the board instead of proposing a card.

## Outcome

Nothing on the board changes, and the agent can only leave a proposed card for the members to decide on.

## Edge cases

- The AI agent tries to edit, delete or create a card, or to accept its own proposed card → refused the same way.
