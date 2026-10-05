---
kind: primary
routes:
  agent: Agent
steps:
  - text: The AI agent reads the stall threshold of the board and when each card entered its column
    kind: actor
    actor: ai-agent
    entities:
      - { entity: board, effect: reads, facts: [Stall threshold] }
      - { entity: card, effect: reads, facts: [Column, Entered column at] }
      - { entity: column, effect: reads, facts: [Position] }
    contexts:
      agent:
        place: agent-tools
  - text: The AI agent flags a card that has stayed in a column other than the last for longer than the threshold
    kind: actor
    actor: ai-agent
    entities:
      - { entity: card, effect: reads, facts: [] }
      - { entity: column, effect: reads, facts: [] }
    contexts:
      agent:
        place: agent-tools
  - text: The Product confirms the card is past the threshold and carries no raised flag
    kind: product
    actor: ai-agent
    entities:
      - { entity: board, effect: reads, facts: [Stall threshold] }
      - { entity: card, effect: reads, facts: [Entered column at] }
    contexts:
      agent:
        place: agent-tools
  - text: The Product raises a stall flag on the card naming its column and how long it has been there
    kind: product
    actor: ai-agent
    entities:
      - { entity: stall-flag, effect: creates, to: Raised, facts: [Reason, Raised at] }
      - { entity: card, effect: reads, facts: [] }
      - { entity: column, effect: reads, facts: [Name] }
    contexts:
      agent:
        place: agent-tools
---

# Flag a card past the stall threshold

## Trigger

The AI agent looks over a board it reads on behalf of a member.

## Outcome

The card carries a raised stall flag that every member of the board sees on the board and on the card, and nothing about the card itself has changed.
