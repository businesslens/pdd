---
kind: primary
routes:
  agent: Agent
steps:
  - text: The AI agent reads a card that carries a raised stall flag on a board it was connected to
    kind: actor
    actor: ai-agent
    entities:
      - { entity: board, effect: reads, facts: [Name] }
      - { entity: card, effect: reads, facts: [Title, Description, Column] }
      - { entity: stall-flag, effect: reads, facts: [Reason] }
    contexts:
      agent:
        place: board-agent
  - text: The AI agent leaves a proposed card for the next step that would get the stalled card moving
    kind: actor
    actor: ai-agent
    entities:
      - { entity: proposed-card, effect: creates, to: Proposed, facts: [Title, Description, Reason, Suggested column] }
      - { entity: card, effect: reads, facts: [] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      agent:
        place: board-agent
  - text: The Product keeps the proposed card waiting for a decision on the board
    kind: product
    actor: ai-agent
    entities:
      - { entity: proposed-card, effect: reads, facts: [] }
      - { entity: board, effect: reads, facts: [] }
    contexts:
      agent:
        place: board-agent
  - text: The stalled card is unchanged and its stall flag stays raised
    kind: condition
    actor: ai-agent
    entities:
      - { entity: card, effect: reads, facts: [] }
      - { entity: stall-flag, effect: reads, facts: [] }
    contexts:
      agent:
        place: board-agent
---

# Propose a next step for a stalled card

## Trigger

The AI agent finds a card the Product has flagged as stalled.

## Outcome

The board's members find a proposed card naming the stalled card it would get moving, and the stalled card and its flag are unchanged.
