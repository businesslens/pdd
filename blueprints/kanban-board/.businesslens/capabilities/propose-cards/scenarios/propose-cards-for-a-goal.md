---
kind: primary
routes:
  agent: Agent
steps:
  - text: The AI agent reads the columns and cards of the board on behalf of a member
    kind: actor
    actor: ai-agent
    entities:
      - { entity: board, effect: reads, facts: [Name] }
      - { entity: column, effect: reads, facts: [Name, Position] }
      - { entity: card, effect: reads, facts: [Title, Column] }
    contexts:
      agent:
        place: agent-tools
  - text: The AI agent submits proposed cards for the goal the member stated
    kind: actor
    actor: ai-agent
    entities:
      - { entity: proposed-card, effect: creates, to: Pending, facts: [Title, Description, Goal, Suggested column] }
      - { entity: board, effect: reads, facts: [] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      agent:
        place: agent-tools
  - text: The Product keeps each proposed card pending for the board
    kind: product
    actor: ai-agent
    entities:
      - { entity: proposed-card, effect: reads, facts: [] }
      - { entity: board, effect: reads, facts: [] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      agent:
        place: agent-tools
  - text: No card is added to the board
    kind: condition
    actor: ai-agent
    entities:
      - { entity: card, effect: reads, facts: [] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      agent:
        place: agent-tools
---

# Propose cards for a goal

## Trigger

A member asks their AI agent to plan a goal on one of their boards.

## Outcome

The board's members find the proposed cards waiting for a decision, each with the goal it serves, and the board itself is unchanged.
