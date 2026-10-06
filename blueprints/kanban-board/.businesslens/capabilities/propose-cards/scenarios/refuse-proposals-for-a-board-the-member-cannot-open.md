---
kind: validation
routes:
  agent: Agent
steps:
  - text: The AI agent tries to leave proposals for a board none of whose members connected it
    kind: actor
    actor: ai-agent
    entities:
      - { entity: board, effect: reads, facts: [] }
    contexts:
      agent:
        place: board-agent
  - text: The Product refuses the proposals
    kind: product
    actor: ai-agent
    entities: []
    contexts:
      agent:
        place: board-agent
  - text: Nothing is added for that board
    kind: condition
    actor: ai-agent
    entities:
      - { entity: board, effect: reads, facts: [] }
    contexts:
      agent:
        place: board-agent
---

# Refuse proposals for a board the member cannot open

## Trigger

The AI agent tries to leave proposed cards for a board the Teammate who connected it is not a member of.

## Outcome

Nothing is proposed for that board, and its members see nothing from the agent.
