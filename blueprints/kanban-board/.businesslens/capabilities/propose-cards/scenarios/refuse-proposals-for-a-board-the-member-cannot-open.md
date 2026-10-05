---
kind: validation
routes:
  agent: Agent
steps:
  - text: The AI agent submits proposals for a board the member it acts for does not belong to
    kind: actor
    actor: ai-agent
    entities:
      - { entity: board, effect: reads, facts: [] }
    contexts:
      agent:
        place: agent-tools
  - text: The Product refuses the proposals
    kind: product
    actor: ai-agent
    entities: []
    contexts:
      agent:
        place: agent-tools
  - text: Nothing is added for that board
    kind: condition
    actor: ai-agent
    entities:
      - { entity: board, effect: reads, facts: [] }
    contexts:
      agent:
        place: agent-tools
---

# Refuse proposals for a board the member cannot open

## Trigger

The AI agent submits proposals for a board its member is not a member of.

## Outcome

Nothing is proposed for that board, and its members see nothing from the agent.
