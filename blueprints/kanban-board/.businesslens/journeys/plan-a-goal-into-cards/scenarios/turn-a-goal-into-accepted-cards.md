---
kind: primary
result: achieved
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
      - { entity: proposed-card, as: useful, effect: creates, to: Pending, facts: [Title, Description, Goal, Suggested column] }
      - { entity: proposed-card, as: unwanted, effect: creates, to: Pending, facts: [Title, Description, Goal, Suggested column] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      agent-to-web:
        place: agent-tools
  - text: The Teammate opens the pending proposed cards
    kind: actor
    actor: teammate
    entities:
      - { entity: proposed-card, as: useful, effect: reads, facts: [Title, Description, Goal, Suggested column] }
      - { entity: proposed-card, as: unwanted, effect: reads, facts: [Title, Description, Goal, Suggested column] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      agent-to-web:
        place: board-web::proposed-cards
  - text: The Teammate accepts the proposed card that fits
    kind: actor
    actor: teammate
    capability: accept-proposed-card
    entities:
      - { entity: proposed-card, as: useful, effect: changes, from: Pending, to: Accepted, facts: [] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      agent-to-web:
        place: board-web::proposed-cards
  - text: The Product adds a card made from it to the bottom of its suggested column
    kind: product
    actor: teammate
    capability: accept-proposed-card
    entities:
      - { entity: card, effect: creates, facts: [Title, Description, Column, Position, Entered column at] }
      - { entity: column, effect: reads, facts: [] }
    contexts:
      agent-to-web:
        place: board-web::proposed-cards
  - text: The Teammate dismisses the proposed card that does not fit
    kind: actor
    actor: teammate
    capability: dismiss-proposed-card
    entities:
      - { entity: proposed-card, as: unwanted, effect: changes, from: Pending, to: Dismissed, facts: [] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      agent-to-web:
        place: board-web::proposed-cards
  - text: The board holds the accepted card and nothing from the dismissed one
    kind: condition
    actor: teammate
    entities:
      - { entity: card, effect: reads, facts: [Title] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      agent-to-web:
        place: board-web::board
---

# Turn a goal into accepted cards

## Trigger

A member asks their AI agent to plan a goal on one of their boards.

## Outcome

The Journey goal is achieved: the card the Teammate accepted is on the board in its suggested column, and the dismissed proposal left nothing behind.
