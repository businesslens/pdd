---
kind: edge
result: not-achieved
routes:
  agent-to-web: Agent to web
steps:
  - text: The Teammate states a goal for one of their boards to the agent they connected
    kind: actor
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [] }
  - text: The AI agent reads the columns and cards of the board for the goal its member stated
    kind: actor
    actor: ai-agent
    capability: propose-cards
    entities:
      - { entity: board, effect: reads, facts: [Name] }
      - { entity: column, effect: reads, facts: [Name, Position] }
      - { entity: card, effect: reads, facts: [Title, Column] }
    contexts:
      agent-to-web:
        place: agent-tools
  - text: The AI agent submits proposed cards for the goal
    kind: actor
    actor: ai-agent
    capability: propose-cards
    entities:
      - { entity: proposed-card, effect: creates, to: Pending, facts: [Title, Description, Goal, Suggested column] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      agent-to-web:
        place: agent-tools
  - text: The Teammate reviews the proposed cards and finds none that fits
    kind: actor
    actor: teammate
    entities:
      - { entity: proposed-card, effect: reads, facts: [Title, Goal] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      agent-to-web:
        place: board-web::proposed-cards
  - text: The Teammate dismisses each proposed card
    kind: actor
    actor: teammate
    capability: dismiss-proposed-card
    entities:
      - { entity: proposed-card, effect: changes, from: Pending, to: Dismissed, facts: [] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      agent-to-web:
        place: board-web::proposed-cards
  - text: The board is unchanged
    kind: condition
    actor: teammate
    entities:
      - { entity: board, effect: reads, facts: [] }
    contexts:
      agent-to-web:
        place: board-web::board
---

# Dismiss every proposal

## Trigger

A member asks their AI agent to plan a goal, and none of its proposals suits the team.

## Outcome

The Journey goal is not achieved: no card was added, and the board is exactly as it was before the agent proposed anything.
