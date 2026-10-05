---
kind: validation
routes:
  agent: Agent
steps:
  - text: The AI agent flags a card that entered its column less than the stall threshold ago
    kind: actor
    actor: ai-agent
    entities:
      - { entity: card, effect: reads, facts: [Entered column at] }
      - { entity: column, effect: reads, facts: [] }
    contexts:
      agent:
        place: agent-tools
  - text: The Product refuses the flag
    kind: product
    actor: ai-agent
    entities:
      - { entity: board, effect: reads, facts: [Stall threshold] }
      - { entity: card, effect: reads, facts: [] }
    contexts:
      agent:
        place: agent-tools
  - text: No stall flag is raised and the card is unchanged
    kind: condition
    actor: ai-agent
    entities:
      - { entity: card, effect: reads, facts: [] }
      - { entity: stall-flag, effect: reads, facts: [] }
    contexts:
      agent:
        place: agent-tools
---

# Refuse a flag before the threshold

## Trigger

The AI agent flags a card that has not yet stayed in its column longer than the stall threshold.

## Outcome

No flag is raised, and the card and the board are unchanged.

## Edge cases

- The card already carries a raised stall flag → refused; a card carries at most one.
- The card is in the board's last column → refused; finished work does not stall.
