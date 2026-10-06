---
kind: primary
routes:
  agent: Agent
steps:
  - text: The AI agent reads the columns and cards of a board it was connected to
    kind: actor
    actor: ai-agent
    entities:
      - { entity: board, effect: reads, facts: [Name] }
      - { entity: column, effect: reads, facts: [Name, Position] }
      - { entity: card, effect: reads, facts: [Title, Column] }
    contexts:
      agent:
        place: board-agent
  - text: The AI agent leaves proposed cards for a goal a member stated
    kind: actor
    actor: ai-agent
    entities:
      - { entity: proposed-card, effect: creates, to: Proposed, facts: [Title, Description, Reason, Suggested column] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      agent:
        place: board-agent
  - text: The Product keeps each proposed card waiting for a decision on the board
    kind: product
    actor: ai-agent
    entities:
      - { entity: proposed-card, effect: reads, facts: [] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      agent:
        place: board-agent
  - text: No card is added to the board
    kind: condition
    actor: ai-agent
    entities:
      - { entity: card, effect: reads, facts: [] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      agent:
        place: board-agent
---

# Propose cards for a goal

## Trigger

A Teammate asks their AI agent to plan a goal on one of their boards.

## Outcome

The board's members find the proposed cards waiting for a decision, each naming the goal it serves, and the board itself is unchanged.
